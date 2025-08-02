export default async function handler(req, res) {
  const apiKey = "RGAPI-861173dc-545e-4504-9426-c79e4bf5d2a7";
  const region = "jp1";
  const name = req.query.name;  // 例: 'HomuraJin'
  const tag = req.query.tag;    // 例: '焔守職人'

  if (!name || !tag) {
    res.status(400).json({ error: "nameとtagを指定してください" });
    return;
  }

  // 1. Riot ID からアカウント取得
  const riotAccountURL = `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?api_key=${apiKey}`;
  const riotAccountRes = await fetch(riotAccountURL);
  if (!riotAccountRes.ok) {
    res.status(404).json({ state: "not found", step: "riot-id", detail: await riotAccountRes.text() });
    return;
  }
  const riotAccount = await riotAccountRes.json();
  const puuid = riotAccount.puuid;

  // 2. puuid からサモナー情報取得
  const summonerURL = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`;
  const summonerRes = await fetch(summonerURL);
  if (!summonerRes.ok) {
    res.status(404).json({ state: "not found", step: "summoner", detail: await summonerRes.text() });
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
    res.status(500).json({ state: "error", detail: await spectatorRes.text() });
  }
}
