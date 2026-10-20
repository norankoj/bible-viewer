// 끼니 성경구절표(.xlsx) → data/kkini.js : 날짜마다 [묵상 글, [책,장,절,끝장,끝절], 통독 글, [책,장]]
// 표는 권(책)마다 4칸 묶음(날짜 | 월 머리 | 묵상 | 통독)이고, 묶음 안에서 "N월" 머리 줄이 나오면 그 달로 바뀜
// 사용: node tools/build-kkini.js "2027년도 끼니 성경구절표.xlsx" 2027
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const [xlsx, year] = process.argv.slice(2), out = path.join(__dirname, '..', 'data', 'kkini.js');
// xlsx(zip)를 풀어 첫 시트를 칸 이름 → 값으로
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kkini-'));
// 윈도·맥의 tar(bsdtar)는 zip 도 풂. 그 밖(리눅스)은 unzip
if (process.platform === 'linux') execFileSync('unzip', ['-q', '-o', path.resolve(xlsx), '-d', tmp]);
else execFileSync(process.platform === 'win32' ? path.join(process.env.SystemRoot, 'System32', 'tar.exe') : 'tar', ['-xf', path.resolve(xlsx), '-C', tmp]);
const ss = [...fs.readFileSync(path.join(tmp, 'xl/sharedStrings.xml'), 'utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => [...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map(x => x[1]).join(''));
const g = {};
for (const m of fs.readFileSync(path.join(tmp, 'xl/worksheets/sheet1.xml'), 'utf8').matchAll(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
  const v = m[4]?.match(/<v>([^<]*)<\/v>/)?.[1]; if (v == null) continue;
  (g[m[2]] ||= {})[m[1]] = / t="s"/.test(m[3]) ? ss[+v] : v;
}
fs.rmSync(tmp, { recursive: true, force: true });
const BOOKS = '창세기 출애굽기 레위기 민수기 신명기 여호수아 사사기 룻기 사무엘상 사무엘하 열왕기상 열왕기하 역대상 역대하 에스라 느헤미야 에스더 욥기 시편 잠언 전도서 아가 이사야 예레미야 예레미야애가 에스겔 다니엘 호세아 요엘 아모스 오바댜 요나 미가 나훔 하박국 스바냐 학개 스가랴 말라기 마태복음 마가복음 누가복음 요한복음 사도행전 로마서 고린도전서 고린도후서 갈라디아서 에베소서 빌립보서 골로새서 데살로니가전서 데살로니가후서 디모데전서 디모데후서 디도서 빌레몬서 히브리서 야고보서 베드로전서 베드로후서 요한일서 요한이서 요한삼서 유다서 요한계시록'.split(' ');
const SHORT = '창 출 레 민 신 수 삿 룻 삼상 삼하 왕상 왕하 대상 대하 스 느 에 욥 시 잠 전 아 사 렘 애 겔 단 호 욜 암 옵 욘 미 나 합 습 학 슥 말 마 막 눅 요 행 롬 고전 고후 갈 엡 빌 골 살전 살후 딤전 딤후 딛 몬 히 약 벧전 벧후 요일 요이 요삼 유 계'.split(' ');
const NAMES = [...BOOKS.map((n, i) => [n, i + 1]), ...SHORT.map((n, i) => [n, i + 1])].sort((a, b) => b[0].length - a[0].length);
// "마태복음 1:1-17", "신명기 16:18-17:13", "창1-2장", "시119편", "행20:1-6" → [책, 장, 절, 끝장, 끝절] (절 없으면 0)
function ref(s) {
  s = s.trim();
  const hit = NAMES.find(([n]) => s.startsWith(n)); if (!hit) return null;
  const rest = s.slice(hit[0].length).trim();
  let m = rest.match(/^(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
  if (m) return [hit[1], +m[1], +m[2], m[3] ? +m[3] : +m[1], m[4] ? +m[4] : +m[2]];
  m = rest.match(/^(\d+)(?:[-~](\d+))?\s*[장편]?$/);
  if (m) return [hit[1], +m[1], 0, m[2] ? +m[2] : +m[1], 0];
  m = rest.match(/^(\d+)장?(?::(\d+))?[-~]/); // '민9-10:10', '삿1장-2:10', '행20:7-23장': 끝이 장 중간 → 시작만
  if (m) return [hit[1], +m[1], m[2] ? +m[2] : 0, +m[1], 0];
  return null;
}
const col = n => { let s = ''; for (n++; n; n = (n - 1) / 26 | 0) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
const days = {}, bad = [];
for (let grp = 0; grp < 12; grp++) {
  const [cDay, cHead, cMed, cRead] = [0, 1, 2, 3].map(k => col(grp * 4 + k));
  let month = 0;
  for (const r of Object.keys(g).map(Number).sort((a, b) => a - b)) {
    const row = g[r], head = row[cHead]?.match(/^(\d+)월$/);
    if (head) { month = +head[1]; continue; }
    const day = row[cDay]?.match(/^(\d+)일$/);
    if (!day || !month) continue;
    const med = (row[cMed] || '').trim(), read = (row[cRead] || '').trim();
    const mr = ref(med.split(',')[0]), rr = ref(read.split(',')[0]);
    if (med && !mr) bad.push(`${month}/${day[1]} 묵상 "${med}"`);
    if (read && !rr) bad.push(`${month}/${day[1]} 통독 "${read}"`);
    days[`${month}-${+day[1]}`] = [med, mr, read, rr && [rr[0], rr[1]]];
  }
}
const n = Object.keys(days).length;
fs.writeFileSync(out, `// 끼니 성경구절표 ${year}년: "월-일": [묵상, [책,장,절,끝장,끝절], 통독, [책,장]] (원본: ${year}년도 끼니 성경구절표.xlsx)\nwindow.KKINI = { year: ${year}, days: {\n${Object.entries(days).map(([k, v]) => JSON.stringify(k) + ': ' + JSON.stringify(v)).join(',\n')}\n} };\n`);
console.log({ 날수: n, 못읽음: bad.length }); bad.forEach(b => console.log(' ', b));
console.log(days['1-1'], days['9-12'], days['10-20'], days['12-31']);
