export default async function handler(req, res) {
  try {
    const apiKey = "RGAPI-af626708-7db8-4a77-b351-1dbc83148e9a";
    const region = "jp1";
    const name = req.query.name;
    const tag = req.query.tag;

    if (!name || !tag) {
      res.status(400).json({ error: "nameとtagを指定してください" });
      return;
    }

    // 1. Riot ID からアカウント取得
    const riotAccountURL = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?api_key=${apiKey}`;
    const riotAccountRes = await fetch(riotAccountURL);
    if (!riotAccountRes.ok) {
      const message = await riotAccountRes.text();
      res.status(404).json({ state: "not found", step: "riot-id", detail: message, status: riotAccountRes.status });
      return;
    }
    const riotAccount = await riotAccountRes.json();
    const puuid = riotAccount.puuid;

    // 2. puuid からサモナー情報取得
    const summonerURL = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`;
    const summonerRes = await fetch(summonerURL);
    if (!summonerRes.ok) {
      const message = await summonerRes.text();
      res.status(404).json({ state: "not found", step: "summoner", detail: message, status: summonerRes.status });
      return;
    }
    const summoner = await summonerRes.json();
    const summonerId = summoner.id;

    // 3. サモナーIDで観戦APIへ（現在プレイ中かチェック）
    const spectatorURL = `https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}?api_key=${apiKey}`;
    const spectatorRes = await fetch(spectatorURL);

    if (spectatorRes.ok) {
      res.json({ state: "playing" });
    } else if (spectatorRes.status === 404) {
      res.json({ state: "offline" });
    } else {
      const message = await spectatorRes.text();
      res.status(500).json({ state: "error", detail: message, status: spectatorRes.status });
    }
  } catch (e) {
    res.status(500).json({ state: "error", error: e.message, stack: e.stack });
  }
}
