// api/bulk-scrape.js
// Triggers one Apify scrape job per product URL

module.exports = async function handler(req, res) {
  const secret = req.headers['x-ingest-secret'] || req.query.secret;
  if (process.env.INGEST_SECRET && secret !== process.env.INGEST_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ================================================================
  // YOUR 50 PRODUCT URLs — replace these with your real links
  // ================================================================
  const productUrls = [
    'https://s.shopee.co.th/6L1GcQC8By',
    'https://s.shopee.co.th/Lk3TVZmx6',
    'https://s.shopee.co.th/4qCSpniaD4',
    'https://s.shopee.co.th/1LcafPN4wi',
    'https://s.shopee.co.th/7KtnoTHVfC',
    'https://s.shopee.co.th/2qROSEeZO4',
    'https://s.shopee.co.th/4ft2ddzF8k',
    'https://s.shopee.co.th/6AhqQPt3n2',
    'https://s.shopee.co.th/1BJATWpE8V',
    'https://s.shopee.co.th/10zkHL1oXM',
    'https://s.shopee.co.th/BQdHolkKg',
    'https://s.shopee.co.th/3B4ErMMf7a',
    'https://s.shopee.co.th/20sHTGhd0S',
    'https://s.shopee.co.th/20sHTJFXLW',
    'https://s.shopee.co.th/2VoY4LSGcZ',
    'https://s.shopee.co.th/4qCSqimZiF',
    'https://s.shopee.co.th/8fPBPnPomn',
    'https://s.shopee.co.th/3qJvevLkNO',
    'https://s.shopee.co.th/5ApJFOBw6j',
    'https://s.shopee.co.th/3Vh5GOJ0E6',
    'https://s.shopee.co.th/AADzCqoiQL',
    'https://s.shopee.co.th/7KtnpgydM1',
    'https://s.shopee.co.th/5flZqgijsv',
    'https://s.shopee.co.th/6fe72YckWa',
    'https://s.shopee.co.th/6L1Gdxhwfp',
    'https://s.shopee.co.th/2VoY4woNIy',
    'https://s.shopee.co.th/9ALS1DrSrv',
    'https://s.shopee.co.th/5flZqo8qyH',
    'https://s.shopee.co.th/5q503AUNed',
    'https://s.shopee.co.th/1qYrHputJs',
    'https://s.shopee.co.th/Lk3VtOXSa',
    'https://s.shopee.co.th/9ALS2Ek60x',
    'https://s.shopee.co.th/4ft2fzVgq9',
    'https://s.shopee.co.th/2VoY62GRc4',
    'https://s.shopee.co.th/9UyIQv7g7J',
    'https://s.shopee.co.th/20sHVF1zCQ',
    'https://s.shopee.co.th/9fHidO8mN0',
    'https://s.shopee.co.th/qgK7AI0j6',
    'https://s.shopee.co.th/4VZcTxG6kx',
    'https://s.shopee.co.th/qgK7EQhsH',
    'https://s.shopee.co.th/9ALS2aoPNk',
    'https://s.shopee.co.th/5VS9fv4faQ',
    'https://s.shopee.co.th/4ft2gSGx0Y',
    'https://s.shopee.co.th/3LNf61Yp13',
    'https://s.shopee.co.th/5q504fSQKG',
    'https://s.shopee.co.th/8V5lFb2L8V',
    'https://s.shopee.co.th/W3Tj2vYGj',
    'https://s.shopee.co.th/5ApJHfxCMn',
    'https://s.shopee.co.th/3qJvhF7ABV',
    'https://s.shopee.co.th/AKXPRRWf5T',
    'https://s.shopee.co.th/AUqpdu5v8Y'
  ];

  const APIFY_TOKEN = process.env.APIFY_TOKEN;
  const ACTOR_ID = 'xtracto~shopee-scraper';

  try {
    const results = await Promise.all(
      productUrls.map(url =>
        fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            country: 'th',
            mode: 'url',
            url: url,
          })
        })
        .then(r => r.json())
        .then(data => ({ url, runId: data.data?.id, ok: true }))
        .catch(err => ({ url, error: err.message, ok: false }))
      )
    );

    const succeeded = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;

    return res.status(200).json({
      message: `Triggered ${succeeded} scraping jobs, ${failed} failed`,
      results
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
