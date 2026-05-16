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
    'https://shopee.co.th/product/56542501/28583640267?gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTElAAAAAzHxBICZgimbayy-2HdWZuB9V2GWCOq81bskJkrp3UUFfQhRnPt4lZaqmsQS4USefsmeRVmzgv1q2VjSFAdMTyjmUpZWoQ27jsw5yB0tFe4S6hml7Kb3r3luiuJ2_Ev_I_pJ-7TnNHSWh0WRD8CRhF7gRjrzkauEEw8AtKaMGgXoByG4KotxZN2QSI5F3NslIc&mmp_pid=an_15377330240&uls_trackid=55ljd3nn00bc&utm_campaign=id_11wDpXzEaLH&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewnibtuvii9m',
    'https://shopee.co.th/product/69426059/23451720884?gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTElAAAAAzGkMRTCWSDKUsCdF92fAZTZ3FBSmQ5h8Cx14lxKbr0Lq86629R4YwlIbxTTy406cRNoozq7v2D_LgXeLZv1adxzHEZO69SzW9ZQciNcQWFXboiQkR1fuBpG4WZII6GHHnchVP7gClNOoZhu0oNveXJNFAfLlTCz1mw-CPbeWiUaY1WnXAVT-toirPx_9z0wmo&mmp_pid=an_15377330240&uls_trackid=55ljd6jq00k7&utm_campaign=id_BvWOsfIeb1&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewnie6x7k9ef',
    'https://shopee.co.th/product/56542501/919327370?gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTEkAAAAAyO5KhJNQrsd68O16gzfFCEtm3USa3lVWzWiAszaBmSa_5pfv_BEpk3cahgPCMWB74v8oS8ACNCUL9VxLHEpy6kqt_PyEQ11fiCW9AzVv0ArEMIiP9ZHTwXoNKAcV6_dkxaN6HWBM5D1vEgDZgCmXQE0bzzVoRFtHEVwUxQqriRwMSljZqHFO6y62Xmdg&mmp_pid=an_15377330240&uls_trackid=55ljd80200bc&utm_campaign=id_HD0vEW6Oet&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewnifbct726k',
    'https://shopee.co.th/product/56542501/21650286130?gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTElAAAAAzxQn6j-y5kyzb3o1Pc75nMNX6FPQ_1ztLAi7DFBwiEkA7tHDow9bWnIizlfVSZoBhN4dKV5Hz80S-NrELvNdV9ReUtFHZGBJ_f9Jb7vbLHbitObBKKny3EQcYNcaJugHDtVnPa1fDS1WfRzGkacmkWeAdIqmnv8VNaPcnjxwSVeXt3GFZ_oUE6olzCNUl1bJU&mmp_pid=an_15377330240&uls_trackid=55ljd94202k7&utm_campaign=id_VCt5jCO4et&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewnig8od834s',
    'https://shopee.co.th/product/56542501/19393499774?gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTElAAAAAxSueSXoHlK6AJM7EwMkNLyguK0jNVoUEHDSq_R9WB5ZAUbGsd-tWO9MFQF47yx2btcuMIgcB1yxlLA3rKDZuY0E8VCSD5yi3EbKH5D5RfEF0LnLObqbnIaA-zlyhOmPHwkKHrLaQveuSC4FItTZrQOmKnuy0jLMAAgw-afbtwQoLkHbAhYx5Y1EtqKD10IUi8&mmp_pid=an_15377330240&uls_trackid=55ljdd7j01jd&utm_campaign=id_xYTjya9FOJ&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewnijkxjzfjv',
    'https://shopee.co.th/opaanlp/121205602/1867293698?__mobile__=1&gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTElAAAAAx9XZ09_zvcuuMp29p0fGnXHdx4VBXfo9cnXXtxt4amNN8Wtz0p_A1RUG9oKDVMfxSkQ3zLsQFFQ54HQNzqFUSVYxfGUrR4yXmr5EMhHKL65HUgJaKYQoGSP0vYOcjimJsg3g10E_c9Kcy6C_0cDY6Cl1ndhuzUPlGhksLV8rMjSwvE7vWqjt-j6Endi4UTSFg&mmp_pid=an_15377330240&uls_trackid=55ljde0a00es&utm_campaign=id_YL26leRa35&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewnik8cgbmuq',
    'https://shopee.co.th/product/56542501/25725904425?gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTElAAAAAxPo3AAf0OHSf3Q6VHRsNcOg_DmYZKfUS1_OLxhJWuywZU1l7qhLC27UNH6xCjcIqA_YD8BhMbtMrJhRtQuy7VJZ5qOFZakmuo_hAQhYhhJI08_pZdW0gxHAl2hvcJ5Vi_WYCvUeULMASd17NCd2GXryZUXZt2KXtoyyeF0biaIjdJwX6e_xZWoN9agQXyuT34&mmp_pid=an_15377330240&uls_trackid=55ljdep600es&utm_campaign=id_Ah3kpMuPQd&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewnikv1e83tu',
    'https://shopee.co.th/product/378293230/4279768578?gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTElAAAAAzPOkmEuM5tKeo-YlNtLtLV0q48qmsFOZEgJzTKlc9Ls8bU11G-zmOOD23wwpAwI6N9JPNlZB0ELWWCtaC3vnoBBj-k46aVIX4b8TbX8P4Li1sKjUGdKoDESNfPvBrd31AKz9Cq_0ryebU9fbzWjQHGNQsafj5FPCa9zWfdUP1BglO5kAPHGE6bt5ujQpWCJUc&mmp_pid=an_15377330240&uls_trackid=55ljdg3j01es&utm_campaign=id_XDOgumQOvv&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewnimxufvc71',
    'https://shopee.co.th/opaanlp/56542501/7253560772?__mobile__=1&gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTEkgAAAAzQ-OQMDtozBIVL8y7saeLLavwsDvVdR4qMDqgo3TPAkDJMoROHk-J0_7qIb8Upkv4GXTSTnRwAHkSRRAjivRRsDUubjquFEuQmDCv5__E5E-guGB8gs0u8xAt2SNqTqQGcavT2hmvECDrRbvjHNhva65wk0RGU5o8NglHhZJ26_zVis1VW-rKpl_eZZY1M&mmp_pid=an_15377330240&uls_trackid=55ljdgs500jd&utm_campaign=id_xi3bAlQ1ih&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewnink7y54r3',
    'https://shopee.co.th/product/56542501/44952142844?gads_t_sig=gqRjZGVrxHCFomtpsTE0MjUxOnRzc19zZGtfa2V5omt20QABpGFsZ2_SAAAAZKNkZWvAomN0xEAAAAAMRoz0ZUjQw0QlRa--FjB0AKnHQPF7xv4DyGj9-GQwqn4zSdB6gztmw7ebmtsZs9FPJxlVqctc57WUE3IRqmNpcGhlcnRleHTElAAAAAzgGS3DDwe1FxkGavI1oTyWp2rdHdqlYXFv6g7S0A3U-rlx-kTTnjyq7_iGj279uNiwpIpcIIfSG_-apDVaYPejfj5k9sjqzpHx1czU2jKH3yO6Ee5BUNAq3rISZsR5u9HOm9R9uQXDbqeAofSbL_WKqVsXoc316v17OlZ1EKP2U2OqOpEOst5pwZPOosYN5gs&mmp_pid=an_15377330240&uls_trackid=55ljdhp000es&utm_campaign=id_13fObfhrQcJ&utm_content=----&utm_medium=affiliates&utm_source=an_15377330240&utm_term=ewniob96potb'
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
