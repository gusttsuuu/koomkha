// api/ingest.js
// Receives Apify webhook and saves scraped prices to Supabase
// This file runs on Vercel as a serverless function

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security check — verify the secret token
  const secret = req.headers['x-ingest-secret'] || req.query.secret;
  if (process.env.INGEST_SECRET && secret !== process.env.INGEST_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = req.body;
    let items = [];
    let category = 'general';

    // Case 1: Apify webhook format (automatic after run completes)
    if (body?.resource?.defaultDatasetId || body?.eventData?.defaultDatasetId) {
      const datasetId = body?.resource?.defaultDatasetId || body?.eventData?.defaultDatasetId;

      // Fetch the actual scraped items from Apify
      const apifyRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}&format=json`
      );
      items = await apifyRes.json();

      // Try to get category from Apify task input
      category = body?.resource?.options?.input?.category || 'general';

    // Case 2: Direct array (for manual testing)
    } else if (Array.isArray(body)) {
      items = body;
    }

    if (!items || items.length === 0) {
      return res.status(200).json({ success: true, processed: 0, message: 'No items to process' });
    }

    let processed = 0;
    let errors = 0;

    for (const item of items) {
      // Skip items without an ID
      if (!item.item_id) continue;

      try {
        // Step 1: Save or update the product
        const { data: product, error: upsertErr } = await db
          .from('products')
          .upsert({
            shopee_item_id: String(item.item_id),
            name: item.name || item.title || 'สินค้า',
            image_url: item.image_url || item.imageUrl || null,
            shopee_url: item.url || null,
            category: item._category || category,
          }, {
            onConflict: 'shopee_item_id',
            ignoreDuplicates: false
          })
          .select('id')
          .single();

        if (upsertErr || !product) {
          errors++;
          continue;
        }

        // Step 2: Save the price snapshot
        const { error: priceErr } = await db.from('prices').insert({
          product_id: product.id,
          price: Number(item.price) || null,
          original_price: Number(item.original_price) || null,
          discount_pct: Number(item.discount_pct) || null,
          rating: Number(item.rating) || null,
          sold_count: Number(item.sold_count) || null,
        });

        if (priceErr) { errors++; continue; }
        processed++;

      } catch (itemErr) {
        errors++;
        console.error('Error processing item:', item.item_id, itemErr);
      }
    }

    return res.status(200).json({
      success: true,
      processed,
      errors,
      total: items.length
    });

  } catch (err) {
    console.error('Ingest error:', err);
    return res.status(500).json({ error: err.message });
  }
};
