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
    'https://shopee.co.th/product/56542501/28583640267',
    'https://shopee.co.th/product/69426059/23451720884',
    'https://shopee.co.th/product/56542501/919327370',
    'https://shopee.co.th/product/56542501/21650286130',
    'https://shopee.co.th/product/56542501/19393499774',
    'https://shopee.co.th/opaanlp/121205602/1867293698',
    'https://shopee.co.th/product/56542501/25725904425',
    'https://shopee.co.th/product/378293230/4279768578',
    'https://shopee.co.th/opaanlp/56542501/7253560772',
    'https://shopee.co.th/product/56542501/44952142844',
    'https://shopee.co.th/product/770604218/29938732714',
    'https://shopee.co.th/opaanlp/770604218/40619138846',
    'https://shopee.co.th/opaanlp/378293230/15417510538',
    'https://shopee.co.th/opaanlp/56542501/26636941816',
    'https://shopee.co.th/opaanlp/70802054/1597134217',
    'https://shopee.co.th/opaanlp/56542501/57306956322',
    'https://shopee.co.th/product/121205602/1867293698',
    'https://shopee.co.th/product/121205602/1867293694',
    'https://shopee.co.th/opaanlp/378293230/25757554533',
    'https://shopee.co.th/opaanlp/378498789/25434789627',
    'https://shopee.co.th/product/206724933/16002579489',
    'https://shopee.co.th/product/219571552/6115714818',
    'https://shopee.co.th/opaanlp/375000755/8613572066',
    'https://shopee.co.th/opaanlp/114559239/1781143527',
    'https://shopee.co.th/opaanlp/114559239/1788237896',
    'https://shopee.co.th/product/114559239/22519237923',
    'https://shopee.co.th/product/794887474/26916762523',
    'https://shopee.co.th/product/114559239/1883377796',
    'https://shopee.co.th/product/325804450/26314158532',
    'https://shopee.co.th/product/97548989/22818810087'
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
