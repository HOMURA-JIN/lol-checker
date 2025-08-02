export default async function handler(req, res) {
  try {
    const apiKey = "RGAPI-49708c50-278d-46aa-83d3-eb4d8f22a249";
    const region = "jp1";
    const name = req.query.name; // 例: 'HomuraJin'
    const tag = req.query.tag;   // 例: '焔守職人'

    if (!name || !tag) {
      res.status(400).json({ error: "nameとtagの両方を指定してください。" });
      return;
    }

    // 1. Riot ID → アカウント（puuid）取得
    const riotAccountUrl = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?api_key=${apiKey}`;
    const riotAccountRes = await fetch(riotAccountUrl);
    if (!riotAccountRes.ok) {
      res.status(404).json({ state: "not found", step: "riot-id", detail: await riotAccountRes.text(), status: riotAccountRes.status });
      return;
    }
    const riotAccount = await riotAccountRes.json();
    const puuid = riotAccount.puuid;

    // 2. puuid → サモナーID取得
    const summonerUrl = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`;
    const summonerRes = await fetch(summonerUrl);
    if (!summonerRes.ok) {
      res.status(404).json({ state: "not found", step: "summoner", detail: await summonerRes.text(), status: summonerRes.status });
      return;
    }
    const summoner = await summonerRes.json();
    const summonerId = summoner.id;

    // 3. サモナーIDで観戦APIチェック（現在プレイ中判定）
    const spectatorUrl = `https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}?api_key=${apiKey}`;
    const spectatorRes = await fetch(spectatorUrl);

    if (spectatorRes.ok) {
      res.json({ state: "playing" });
    } else if (spectatorRes.status === 404) {
      res.json({ state: "offline" });
    } else {
      res.status(500).json({ state: "error", detail: await spectatorRes.text(), status: spectatorRes.status });
    }
  } catch (e) {
    res.status(500).json({ state: "error", error: e.message, stack: e.stack });
  }
}
