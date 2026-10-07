// OpenBible.info 교차 참조(CC BY 4.0, https://www.openbible.info/labs/cross-references/)를
// 뷰어용 작은 파일 data/xrefs.js 로 바꿈 (파일로 연 index.html에서도 읽히도록 스크립트 형태).
// 사용: node tools/build-xrefs.js cross_references.txt
// 결과: window.XREFS = 31102줄(절 순서) 문자열, 각 줄 = 공백으로 나눈 "대상절[+범위길이]" (36진수), 투표 많은 순
const fs = require('fs');
const { VERSES, START } = require('../decode.js');

const OSIS = 'Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev'.split(' ');
const MAX_PER_VERSE = 30; // 너무 많은 절은 투표 상위만

// "John.3.16" → 줄 번호 (절 구분에 없는 절이면 -1)
const index = ref => {
  const [book, c, v] = ref.split('.'), b = OSIS.indexOf(book) + 1;
  return b && VERSES[b - 1][c - 1] >= +v ? START[b][c - 1] + +v - 1 : -1;
};

const lists = Array.from({ length: 31102 }, () => []);
let kept = 0, skipped = 0;
for (const line of fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).slice(1)) {
  const [from, to, votes] = line.split('\t');
  if (!to || +votes < 0) continue; // 반대 투표가 더 많은 연결은 뺌
  const [a, z] = to.split('-'), f = index(from), s = index(a), e = z ? index(z) : s;
  if (f < 0 || s < 0 || e < s) { skipped++; continue; }
  lists[f].push([+votes, s, e - s]);
  kept++;
}
const out = lists.map(l => l.sort((x, y) => y[0] - x[0]).slice(0, MAX_PER_VERSE)
  .map(([, s, n]) => s.toString(36) + (n ? '+' + n.toString(36) : '')).join(' ')).join('\n');
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/xrefs.js', '// 교차 참조: OpenBible.info (CC BY 4.0) https://www.openbible.info/labs/cross-references/\nwindow.XREFS = ' + JSON.stringify(out) + ';\n');
console.log(`연결 ${kept}개 (제외 ${skipped}개), 파일 ${(out.length / 1024 / 1024).toFixed(2)}MB`);
