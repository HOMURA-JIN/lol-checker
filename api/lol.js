export default async function handler(req, res) {
  const apiKey = "RGAPI-861173dc-545e-4504-9426-c79e4bf5d2a7";
  const region = "jp1";
  const name = req.query.name;

  // サモナーID取得
  const url1 = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}?api_key=${apiKey}`;
  const summonerRes = await fetch(url1);
  if (!summonerRes.ok) {
    res.status(404).json({ state: "not found" });
    return;
  }
  const summonerData = await summonerRes.json();
  const summonerId = summonerData.id;

  // ゲーム中か判定
  const url2 = `https://${region}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${summonerId}?api_key=${apiKey}`;
  const gameRes = await fetch(url2);

  res.json({ state: gameRes.ok ? "playing" : "offline" });
}
