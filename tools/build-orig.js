// STEPBible TAHOT(히브리어 구약)·TAGNT(헬라어 신약) (CC BY 4.0, https://github.com/STEPBible/STEPBible-Data)를
// 뷰어용 작은 파일로: data/orig-ot.js, data/orig-nt.js
// 사용: node tools/build-orig.js <TAHOT 파일 4개> <TAGNT 파일 2개>
// 결과: window.ORIG_OT / ORIG_NT = 절마다 한 줄, "글자열쇠:번호(36진수)" 를 공백으로 (본문 순서)
const fs = require('fs');
const { VERSES, START, origKey } = require('../decode.js');

const BOOKS = 'Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev'.split(' ');
const lines = new Array(31102).fill(null).map(() => []);
let words = 0, skipped = 0;
const unknownBooks = new Set();

for (const file of process.argv.slice(2)) {
  for (const row of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    // "Gen.1.1#01=L" / "Mal.4.1(3.19)#01=L" / "Jhn.3.16#01=NKO" : 앞의 것이 영어(KJV)식 절 번호
    const m = row.match(/^(\w+)\.(\d+)\.(\d+)(?:\([^)]*\))?#\d+/);
    if (!m) continue;
    const b = BOOKS.indexOf(m[1]) + 1, c = +m[2], v = +m[3];
    if (!b) { unknownBooks.add(m[1]); continue; }
    if (!(VERSES[b - 1][c - 1] >= v)) { skipped++; continue; }
    const col = row.split('\t');
    const ot = b <= 39;
    const form = (ot ? col[1] : col[1].split(' (')[0]).replace(/[\/\\־]/g, '');
    // 히브리어: {H7225G} 가 본 단어(나머지 H9000번대는 접두어). 헬라어: "G0025=V-AAI-3S"
    const num = ot ? (col[4].match(/\{H(\d+)/) || col[4].match(/H(\d+)/))?.[1] : col[3].match(/G(\d+)/)?.[1];
    const key = origKey(form);
    if (!key || !num || +num >= 9000) continue;
    lines[START[b][c - 1] + v - 1].push(`${key}:${(+num).toString(36)}`);
    words++;
  }
}
if (unknownBooks.size) throw new Error('모르는 책 약자: ' + [...unknownBooks].join(' '));
const OT = 23145;
const write = (name, from, to) => {
  const text = lines.slice(from, to).map(l => l.join(' ')).join('\n');
  fs.writeFileSync(`data/${name}.js`, `// 원어 단어 번호: STEPBible ${name === 'orig-ot' ? 'TAHOT' : 'TAGNT'} (CC BY 4.0) https://github.com/STEPBible/STEPBible-Data\nwindow.${name === 'orig-ot' ? 'ORIG_OT' : 'ORIG_NT'} = ${JSON.stringify(text)};\n`);
  return (text.length / 1048576).toFixed(2) + 'MB';
};
fs.mkdirSync('data', { recursive: true });
console.log(`단어 ${words}개 (절 구분 밖 ${skipped}), 구약 ${write('orig-ot', 0, OT)}, 신약 ${write('orig-nt', OT, 31102)}`);
