// Vercel 서버 함수: ESV API 키(환경변수 ESV_API_KEY)를 숨긴 채 성경 한 장씩만 대신 받아 옴.
// 사용: /api/esv?b=43&c=3  →  { verses: ["In the beginning…", …] }
const { VERSES, esvQuery, parseEsv } = require('../decode.js');

module.exports = async (req, res) => {
  // ESV 조건(임시 보관 500절 이하) 때문에 서버·CDN에 보관하지 않음
  res.setHeader('Cache-Control', 'no-store');
  const b = Number(req.query.b), c = Number(req.query.c);
  // 성경 한 장 요청만 받음 (다른 용도로 키를 쓰지 못하게)
  if (!Number.isInteger(b) || !Number.isInteger(c) || !VERSES[b - 1]?.[c - 1]) return res.status(400).json({ error: 'bad reference' });
  const key = process.env.ESV_API_KEY;
  if (!key) return res.status(503).json({ error: 'ESV_API_KEY is not set' });
  try {
    const r = await fetch('https://api.esv.org/v3/passage/text/?' + esvQuery(b, c), { headers: { Authorization: 'Token ' + key } });
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: `ESV ${r.status}` });
    res.status(200).json({ verses: parseEsv((await r.json()).passages?.[0] || '') });
  } catch {
    res.status(502).json({ error: 'ESV unreachable' });
  }
};
