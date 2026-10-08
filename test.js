// 실행: node test.js "<Hokma2.cmt.twm 경로>"
const { DatabaseSync } = require('node:sqlite');
const assert = require('node:assert');
const { toHtml, parseRef, VERSES, START, parseOnt, verseHtml, parseEsv, plainVerse, crossHebrew, crossGreek, headword, lemmaKey, lemmaFinder } = require('./decode.js');

// 크로스 글꼴 → 유니코드
assert.strictEqual(crossHebrew('!yhiOla>'), 'אֱלֹהִים'.normalize('NFC'));
assert.strictEqual(crossHebrew('h[;r;'), 'רָעָה'.normalize('NFC'));
assert.strictEqual(crossHebrew('ba;\''), 'אָב'.normalize('NFC'));       // 파타흐+점 = 카메츠
assert.strictEqual(crossHebrew('@a;v] tyBe'), 'בֵּית שְׁאָן'.normalize('NFC')); // 여러 단어도 순서대로
assert.strictEqual(crossGreek('ajgavph'), 'ἀγάπη');
assert.strictEqual(crossGreek('qeov"'), 'θεός');
assert.strictEqual(crossGreek('!Abraavm'), 'Ἀβραάμ');                 // 대문자 앞 숨표
assert.strictEqual(lemmaKey('בָּרָא'), lemmaKey('ברא'));
assert.strictEqual(lemmaKey('θεός'), lemmaKey('θεος'));

// BHS 같은 원어 본문: 단어는 누를 수 있게(기본형), 음역·기본형 풀이는 작게, 복사할 땐 빼고
const bhs = "בְּ <TRANS>bᵊ<trans> <sub><font color='gray'>בְּ in</font></sub> רֵאשִׁ֖ית";
assert.strictEqual(verseHtml(bhs), '<span class="w" data-lemma="בְּ" data-gloss="in">בְּ</span> <span class="tr">bᵊ</span> <span class="gl">בְּ in</span> רֵאשִׁ֖ית');
// 각주: 표준새번역식(본문 표시 + 절 끝 괄호), theWord <RF>
const snb = "주 하나님이 b땅의 흙으로 c사람을 지으시고, 생명체가 되었다.(b 히, '아다마' c 히, '아담')";
assert.strictEqual(plainVerse(snb), '주 하나님이 땅의 흙으로 사람을 지으시고, 생명체가 되었다.');
assert.match(verseHtml(snb), /<sup class="fn"[^>]*data-fn="히, &#39;아다마&#39;|<sup class="fn"[^>]*data-fn="히, '아다마'"[^>]*>b<\/sup>땅의/);
assert.doesNotMatch(verseHtml(snb), /\(b 히/);
const nested = "b그룹들을 세우시고(b 살아 있는 피조물, 얼굴을 가지고 있는 것으로 생각됨(겔 1:5-12; 10:21))";
assert.strictEqual(plainVerse(nested), '그룹들을 세우시고');
assert.strictEqual(plainVerse('본문에 표시가 없으면 (a 그대로 둠)'), '본문에 표시가 없으면 (a 그대로 둠)'); // 표시를 못 찾으면 손대지 않음
assert.match(verseHtml('In the beginning<RF>Or, at first<Rf> God'), /beginning<sup class="fn"[^>]*data-fn="Or, at first"[^>]*>1<\/sup> God/);
assert.strictEqual(plainVerse('In the beginning<RF>Or, at first<Rf> God'), 'In the beginning God');

// 다른 앱 형식: Bible Analyzer 성경 HTML(ESV 각주) → theWord 태그, Bible Analyzer 사전 HTML
{
  const { bdbText, dctHtml } = require('./decode.js');
  const esv = 'If you do well, will you not be accepted?<sup>①</sup> Its desire is for<sup>②</sup> you.”<br>→ <sup>①</sup>Hebrew <i>will there not be a lifting up</i> [of your face]? <sup>②</sup>Or <i>to</i>, or <i>toward</i> <a name=\'B:10 3:16\'>3:16';
  assert.strictEqual(bdbText(esv), 'If you do well, will you not be accepted?<RF>Hebrew will there not be a lifting up [of your face]?<Rf> Its desire is for<RF>Or to, or toward 3:16<Rf> you.”');
  assert.strictEqual(plainVerse(bdbText(esv)), 'If you do well, will you not be accepted? Its desire is for you.”');
  assert.strictEqual(bdbText('[A Psalm of David.]<br>The LORD is my <i>shepherd</i>'), '[A Psalm of David.] The LORD is my <FI>shepherd<Fi>');
  const h = dctHtml("ἀγάπη^<font color='#328AE1'>아가페</font><br><b>1.</b> 아가파오(<num>G25</num>)에서 <script>x</script>");
  assert.match(h, /^<span class="grk">ἀγάπη<\/span> 아가페<br><b>1\.<\/b> 아가파오\(<a href="#" data-strong="G25">G25<\/a>\)에서 x$/);
  assert.match(dctHtml('אֱלֹהִים^엘로아흐(H433, 하나님)'), /엘로아흐\(<a href="#" data-strong="H433">H433<\/a>, 하나님\)/); // 글자로 적힌 번호도 링크
}

// 번호 없는 원어 성경에 STEPBible 번호 붙이기 (악센트·대소문자·끝글자 무시, 본문 순서대로)
{
  const { origKey, tagOriginal } = require('./decode.js');
  assert.strictEqual(origKey('Οὕτως'), origKey('ουτως'));
  assert.strictEqual(tagOriginal('Οὕτως γὰρ ἠγάπησεν', `${origKey('ουτως')}:${(3779).toString(36)} ${origKey('ηγαπησεν')}:p`, 'G'), 'Οὕτως<WG3779> γὰρ ἠγάπησεν<WG25>');
  assert.strictEqual(tagOriginal('בָּרָא אֱלֹהִים', origKey('אלהים') + ':' + (430).toString(36), 'H'), 'בָּרָא אֱלֹהִים<WH430>');
}

// HebGrkKo 사전(선택: 네 번째 인자 .dct)과 bhs5t 기본형 연결
if (process.argv[5]) {
  const { lemmaFinder } = require('./decode.js');
  const d = new DatabaseSync(process.argv[5], { readOnly: true });
  const entries = d.prepare("select scode s, dtext from Lexicon where scode like 'H%'").all().map(r => ({ s: r.s, h: r.dtext.split('^')[0].trim() }));
  const find = lemmaFinder(entries);
  for (const [lemma, strong] of [['ברא', 'H1254'], ['אֱלֹהִים', 'H430'], ['אַהֲרֹן', 'H175'], ['יַעֲקֹב', 'H3290']]) assert(find(lemma).includes(strong), `${lemma} → ${strong}: ${find(lemma)}`);
  console.log('dct ok');
}

// 검색어
{
  const { parseQuery } = require('./decode.js');
  const q = parseQuery('사랑 "독생자를 주셨으니"');
  assert.deepStrictEqual(q.terms, ['독생자를 주셨으니', '사랑']);
  assert(q.test('하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니'));
  assert(!q.test('독생자를 사랑하사')); // 따옴표 안은 붙은 그대로
  assert(parseQuery('god LOVED').test('For God so loved the world'));
  assert.strictEqual(parseQuery('h430').strong, 'H430');
  assert.strictEqual(parseQuery('사랑').strong, null);
  assert(!parseQuery('   ').test('아무 글'));
}

// 스트롱 번호 태그가 붙은 성경 (KJV+, TR+ 등)
assert.strictEqual(verseHtml('In the beginning<WH7225> God<WH430> created<WH1254><WH853>'),
  'In the <span class="w" data-strong="H7225">beginning</span> <span class="w" data-strong="H430">God</span> <span class="w" data-strong="H1254,H853">created</span>');
assert.strictEqual(plainVerse(bhs), 'בְּ רֵאשִׁ֖ית');
assert.strictEqual(verseHtml('<K>קטיב<k> <R>קרי<r>'), '<span class="kt">[קטיב]</span> <span class="qr">קרי</span>');
// .ot(구약만) / .nt(신약만): 제자리에 들어가고, 나머지는 빈 절
const enc = s => new TextEncoder().encode(s);
const ot = parseOnt(enc(Array.from({ length: 23145 }, (_, i) => 'o' + i).join('\n') + '\n\nr2l=1\n'), 'ot');
assert.strictEqual(ot.length, 31102); assert.strictEqual(ot[0], 'o0'); assert.strictEqual(ot[23144], 'o23144'); assert.strictEqual(ot[23145], ''); assert.strictEqual(ot.rtl, true);
const nt = parseOnt(enc(Array.from({ length: 7957 }, (_, i) => 'n' + i).join('\n')), 'nt');
assert.strictEqual(nt[23145], 'n0'); assert.strictEqual(nt[31101], 'n7956'); assert.strictEqual(nt[0], ''); assert.strictEqual(nt.rtl, false);

// ESV API 본문 → 절 배열 (시 같은 줄바꿈·들여쓰기는 공백 하나로)
assert.deepStrictEqual(parseEsv('\n  [1] The LORD is my shepherd;\n      I shall not want.\n  [2] He makes me lie down\n'),
  ['The LORD is my shepherd; I shall not want.', 'He makes me lie down']);

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

// Vercel 서버 함수 /api/esv: 키 숨김, 한 장 요청만 허용
(async () => {
  const handler = require('./api/esv.js');
  const call = async query => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(s) { this.code = s; return this; }, json(j) { this.body = j; return this; } };
    await handler({ query }, res);
    return res;
  };
  let sent;
  global.fetch = async (url, opt) => { sent = { url, auth: opt.headers.Authorization }; return { ok: true, json: async () => ({ passages: ['[1] In the beginning [2] The earth'] }) }; };
  delete process.env.ESV_API_KEY;
  assert.strictEqual((await call({ b: '43', c: '3' })).code, 503); // 키 설정 전
  process.env.ESV_API_KEY = 'secret';
  for (const q of [{ b: '67', c: '1' }, { b: '43', c: '22' }, { b: 'x', c: '1' }, {}]) assert.strictEqual((await call(q)).code, 400);
  const ok = await call({ b: '65', c: '1' });
  assert.strictEqual(ok.code, 200);
  assert.deepStrictEqual(ok.body.verses, ['In the beginning', 'The earth']);
  assert.strictEqual(ok.headers['Cache-Control'], 'no-store');
  assert.match(decodeURIComponent(sent.url), /q=Jude\+1:1-25/);
  assert.strictEqual(sent.auth, 'Token secret');
  assert(!JSON.stringify(ok.body).includes('secret')); // 키가 응답에 새지 않음
  console.log('api/esv ok');
})();

// 사전(선택: 세 번째 인자로 .gbk.twm 경로): 표제어가 원어로 풀리고, BHS 기본형으로 번호를 찾음
if (process.argv[4]) {
  const dict = new DatabaseSync(process.argv[4], { readOnly: true });
  const html = s => toHtml(dict.prepare('select cast(c.data as blob) d from topics t join content c on c.topic_id = t.id where t.subject = ?').get(s).d);
  assert.strictEqual(headword(html('H430')), 'אֱלֹהִים'.normalize('NFC'));
  assert.strictEqual(headword(html('G26')), 'ἀγάπη');
  assert.strictEqual(headword(html('H3290')), 'יַעֲקֹב'.normalize('NFC')); // RTF의 \} (하테프 파타흐)가 단어 중간에 있어도
  const entries = [];
  for (const { s, d } of dict.prepare("select t.subject s, cast(c.data as blob) d from topics t join content c on c.topic_id = t.id where t.subject like 'H%'").iterate())
    entries.push({ s, h: headword(toHtml(d)) });
  const find = lemmaFinder(entries);
  // 창 1:1 BHS 기본형들 + 철자 차이(바브 유무)
  for (const [lemma, strong] of [['ברא', 'H1254'], ['אֱלֹהִים', 'H430'], ['רֵאשִׁית', 'H7225'], ['שָׁמַיִם', 'H8064'], ['אֶרֶץ', 'H776'], ['אַהֲרֹן', 'H175']])
    assert(find(lemma).includes(strong), `${lemma} → ${strong}: ${find(lemma)}`);
  assert.deepStrictEqual(find('וְ'), []); // 접두어는 엉뚱한 항목과 맞으면 안 됨
  console.log('dict ok');
}

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
