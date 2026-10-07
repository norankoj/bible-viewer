// 실행: node test.js "<Hokma2.cmt.twm 경로>"
const { DatabaseSync } = require('node:sqlite');
const assert = require('node:assert');
const { toHtml, parseRef, VERSES, START, parseOnt, verseHtml } = require('./decode.js');

// 절 구분표: 66권, 1189장, 31102절, 요 3:16 = 26136번째 줄
assert.strictEqual(VERSES.length, 66);
assert.strictEqual(VERSES.flat().length, 1189);
assert.strictEqual(VERSES.flat().reduce((a, b) => a + b), 31102);
assert.strictEqual(START[43][2] + 15, 26136);
assert.strictEqual(verseHtml('<FR>a<Fr> <세계의 시작> <x>b'), '<span class="red">a</span> <b class="ts">세계의 시작</b> b');
assert.strictEqual(verseHtml('<FR>a <FI>b'), '<span class="red">a <i>b</i></span>'); // 안 닫힌 태그
assert.strictEqual(parseOnt(new Uint8Array([0xc5, 0xc2, 0x0a]))[0], '태'); // EUC-KR

const db = new DatabaseSync(process.argv[2], { readOnly: true });
const get = (b, c, v) => db.prepare('select cast(data as blob) d from bible_refs join content using(topic_id) where bi=? and ci=? and fvi=?').get(b, c, v);

const john = toHtml(get(43, 3, 16).d);
assert.match(john, /복음서들 속에 있는 복음/);

const rvf = toHtml(get(14, 9, 1).d); // RVF 형식 항목
assert.match(rvf, /[가-힣]{5}/);
assert.match(rvf, /data-ref="tw:\/\/bible\.\*\?id=26\.27\.22/);
assert.doesNotMatch(rvf, /[\u0000-\u0008]|�/);
assert.doesNotMatch(rvf, /<a [^>]*>\) 상품들/); // 일반 텍스트에 붙은 태그는 링크 아님

assert.deepStrictEqual(parseRef('tw://bible.*?id=11.4.29-11.4.31|_AUTODETECT_|'), [11, 4, 29]);

// 주석이 가리키는 절이 절 구분표 범위 안에 있는지 (호크마 자체 오류 6곳: 왕하12, 대상28, 대하34, 시8, 시87, 아6)
const out = db.prepare('select bi, ci, max(tvi) v from bible_refs group by bi, ci').all().filter(r => !(VERSES[r.bi - 1][r.ci - 1] >= r.v));
assert(out.length <= 6, JSON.stringify(out));

// 실제 성경 파일로 위치 확인 (선택: 두 번째 인자로 .ont 경로)
if (process.argv[3]) {
  const L = parseOnt(require('fs').readFileSync(process.argv[3]));
  assert.match(L[START[19][118] + 175], /양|잃/); // 시 119:176
  assert.match(L[START[39][3] + 5], /땅을 칠/);  // 말 4:6
  assert.match(L[START[66][21] + 20], /은혜/);   // 계 22:21
}

// 전체 항목이 예외 없이 변환되고 한글이 나오는지
let n = 0, bad = 0;
for (const { d } of db.prepare('select cast(data as blob) d from content').iterate()) {
  n++; if (!/[가-힣]/.test(toHtml(d))) bad++;
}
console.log(`${n} entries, ${bad} without Hangul`);
assert(bad < n * 0.01);
console.log('ok');
