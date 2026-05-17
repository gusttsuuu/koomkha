// api/ingest.js
// Receives Apify webhook and saves scraped prices to Supabase
// Handles both keyword mode and URL/detail mode data structures

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Case 1: Apify webhook format
    if (body?.resource?.defaultDatasetId || body?.eventData?.defaultDatasetId) {
      const datasetId = body?.resource?.defaultDatasetId || body?.eventData?.defaultDatasetId;
      const apifyRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}&format=json`
      );
      items = await apifyRes.json();
    }
    // Case 2: Direct array
    else if (Array.isArray(body)) {
      items = body;
    }

    if (!items || items.length === 0) {
      return res.status(200).json({ success: true, processed: 0 });
    }

    let processed = 0;
    let errors = 0;

    for (const item of items) {
      // Support both keyword mode (item_id) and URL mode (item_id or itemId)
      const itemId = String(item.item_id || item.itemId || item.id || '');
      if (!itemId) { errors++; continue; }

      try {
        // ================================================================
        // EXTRACT PRICE — checks all possible locations
        // In URL/detail mode: price is inside models[0]
        // In keyword mode: price is at top level
        // Shopee stores prices as integer × 100000 in some modes
        // ================================================================
        const price = extractPrice(item);
        const originalPrice = extractOriginalPrice(item);
        const discountPct = extractDiscountPct(item, price, originalPrice);

        // ================================================================
        // EXTRACT OTHER FIELDS
        // ================================================================
        const name = item.name || item.title || item.Name || 'สินค้า';
        const imageUrl = extractImageUrl(item);
        const shopeeUrl = extractUrl(item);
        const rating = extractRating(item);
        const soldCount = item.sold || item.sold_count || item.historical_sold || null;
        const category = item._category || item.category || 'general';

        // ================================================================
        // SAVE TO SUPABASE
        // ================================================================
        const { data: product, error: upsertErr } = await db
          .from('products')
          .upsert({
            shopee_item_id: itemId,
            name: name,
            image_url: imageUrl,
            shopee_url: shopeeUrl,
            category: category,
          }, { onConflict: 'shopee_item_id', ignoreDuplicates: false })
          .select('id')
          .single();

        if (upsertErr || !product) {
          console.error('Upsert error:', upsertErr?.message, 'item:', itemId);
          errors++; continue;
        }

        // Only save price if we actually have one
        if (price !== null) {
          const { error: priceErr } = await db.from('prices').insert({
            product_id: product.id,
            price: price,
            original_price: originalPrice,
            discount_pct: discountPct,
            rating: rating,
            sold_count: soldCount,
          });
          if (priceErr) {
            console.error('Price insert error:', priceErr?.message);
          }
        }

        processed++;

      } catch (itemErr) {
        console.error('Error processing item:', itemId, itemErr.message);
        errors++;
      }
    }

    return res.status(200).json({ success: true, processed, errors, total: items.length });

  } catch (err) {
    console.error('Ingest error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function extractPrice(item) {
  // 1. Top-level price fields (keyword mode)
  for (const field of ['price', 'price_min', 'price_max']) {
    const val = item[field];
    if (val != null && val > 0) {
      return normalizePrice(val);
    }
  }
  // 2. Price inside models array (URL/detail mode)
  if (Array.isArray(item.models) && item.models.length > 0) {
    for (const model of item.models) {
      for (const field of ['price', 'price_current', 'current_price']) {
        const val = model[field];
        if (val != null && val > 0) {
          return normalizePrice(val);
        }
      }
    }
  }
  // 3. Tier variations
  if (Array.isArray(item.tier_variations) && item.tier_variations.length > 0) {
    const tv = item.tier_variations[0];
    if (tv?.price_before_discount > 0) return normalizePrice(tv.price_before_discount);
  }
  return null;
}

function extractOriginalPrice(item) {
  for (const field of ['original_price', 'price_before_discount', 'price_min_before_discount', 'price_max_before_discount']) {
    const val = item[field];
    if (val != null && val > 0) {
      return normalizePrice(val);
    }
  }
  if (Array.isArray(item.models) && item.models.length > 0) {
    for (const model of item.models) {
      const val = model.price_before_discount;
      if (val != null && val > 0) return normalizePrice(val);
    }
  }
  return null;
}

function extractDiscountPct(item, price, originalPrice) {
  // Direct field
  if (item.discount_pct != null && item.discount_pct > 0) return Number(item.discount_pct);
  // Calculate from prices
  if (price && originalPrice && originalPrice > price) {
    return Math.round((1 - price / originalPrice) * 100);
  }
  return null;
}

function normalizePrice(val) {
  // Shopee stores prices as integer × 100000 in URL mode
  // e.g. ฿899 is stored as 89900000
  if (val > 100000) {
    return Math.round(val / 100000);
  }
  return Number(val);
}

function extractImageUrl(item) {
  if (item.image_url) return item.image_url;
  if (item.imageUrl) return item.imageUrl;
  // URL mode: images is an array of hashes or URLs
  if (Array.isArray(item.images) && item.images.length > 0) {
    const img = item.images[0];
    if (typeof img === 'string') {
      // If it looks like a full URL
      if (img.startsWith('http')) return img;
      // Shopee image hash → full URL
      return `https://cf.shopee.co.th/file/${img}`;
    }
    if (img?.url) return img.url;
  }
  // Single image field
  if (item.image && typeof item.image === 'string') {
    if (item.image.startsWith('http')) return item.image;
    return `https://cf.shopee.co.th/file/${item.image}`;
  }
  return null;
}

function extractUrl(item) {
  if (item.url && item.url.startsWith('http')) return item.url;
  if (item.shopee_url) return item.shopee_url;
  // Construct from shop_id + item_id
  const shopId = item.shop_id || item.shopId;
  const itemId = item.item_id || item.itemId;
  if (shopId && itemId) {
    const slug = (item.name || item.title || 'product')
      .substring(0, 60)
      .replace(/[^a-zA-Z0-9ก-๙\s-]/g, '')
      .replace(/\s+/g, '-');
    return `https://shopee.co.th/${slug}-i.${shopId}.${itemId}`;
  }
  return 'https://shopee.co.th';
}

function extractRating(item) {
  if (item.rating != null) return Number(item.rating);
  if (item.rating_star != null) return Number(item.rating_star);
  if (item.item_rating?.rating_star != null) return Number(item.item_rating.rating_star);
  return null;
}
