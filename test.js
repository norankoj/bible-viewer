// 실행: node test.js "<Hokma2.cmt.twm 경로>"
const { DatabaseSync } = require('node:sqlite');
const assert = require('node:assert');
const { toHtml, parseRef, VERSES, START, parseOnt, verseHtml, plainVerse, crossHebrew, crossGreek, headword, lemmaKey, lemmaFinder } = require('./decode.js');

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

// 베들레헴 개역개정S(.sdb): 단어 뒤 스트롱 번호는 남기고 번호 없음(<WH0>)은 지움
{
  const { bdbText, verseHtml } = require('./decode.js');
  assert.strictEqual(bdbText('빛이<WH216> 있으라<WH1961> 하시니<WH0> 다<WG 3956> 그<WG>'), '빛이<WH216> 있으라<WH1961> 하시니<WX> 다<WG3956> 그<WX>');
  // 한국어는 번호 하나가 앞 묶음 전체의 것: "마르게 하사<WH3001>" 전체가 한 단어 (번호 없음 표시 <WX> 는 묶음 경계)
  assert.strictEqual(verseHtml(bdbText('물을<WH4325> 마르게 하사<WH3001> 너희가<WH0> 애굽에서<WH4714>')),
    '<span class="w" data-strong="H4325">물을</span> <span class="w" data-strong="H3001">마르게 하사</span> 너희가 <span class="w" data-strong="H4714">애굽에서</span>');
  assert.match(verseHtml(bdbText('하나님이<WH430> 이르시되<WH559>')), /<span class="w" data-strong="H430">하나님이<\/span>/);
}

// 인터리니어(TRa+I): 영어 뜻 <Q>…<q> 는 작은 뜻 칸으로, 번호는 영어가 아니라 헬라어 단어에, 복사·검색 글자에서는 영어 빼기
{
  const { verseHtml, plainVerse } = require('./decode.js');
  const t = 'γὰρ<Q>FOR SO<q><WG1063><WTCONJ> ἠγάπησεν<WG25><WTV-AAI-3S>';
  assert.strictEqual(verseHtml(t), '<span class="w" data-strong="G1063">γὰρ</span><span class="gl">FOR SO</span> <span class="w" data-strong="G25">ἠγάπησεν</span>');
  assert.strictEqual(plainVerse(t), 'γὰρ ἠγάπησεν');
}

// 번호 때문에 쪼개진 띄어쓰기를 일반 본문에 맞춤 (글자가 조금 다른 판이어도 같은 부분은 맞춤)
{
  const { respace, plainVerse } = require('./decode.js');
  assert.strictEqual(respace('태초에<WH7225> 천<WH8064> 지를<WH776> 창조하시니라<WH1254>', '태초에 천지를 창조하시니라'), '태초에<WH7225> 천<WH8064>지를<WH776> 창조하시니라<WH1254>');
  assert.strictEqual(plainVerse(respace('세째<WH7992> 강의<WH5104> 이름은<WH8034> 힛데<WH2313> 겔이라', '셋째 강의 이름은 힛데겔이라')), '세째 강의 이름은 힛데겔이라');
  assert.strictEqual(respace('그<WG846> 를<WG1519>', '전혀 다른 글'), '그<WG846> 를<WG1519>'); // 짝이 없으면 그대로
}

// 기기끼리 메모·책갈피 합치기
{
  const { mergeMarks } = require('./decode.js');
  const r = mergeMarks(
    [{ id: 'a', note: '옛 메모', t: 1 }, { id: 'b', t: 5 }, { id: 'c', t: 9 }],
    { d: 6 },
    [{ id: 'a', note: '새 메모', t: 2 }, { id: 'd', t: 4 }, { id: 'c', t: 3 }, { id: 'e', t: 1 }],
    { b: 7, e: 0 });
  const by = Object.fromEntries(r.marks.map(m => [m.id, m]));
  assert.strictEqual(by.a.note, '새 메모'); // 나중에 고친 쪽
  assert(!by.b && !by.d);                   // 다른 기기에서 나중에 지운 것은 지움
  assert.strictEqual(by.c.t, 9);            // 이쪽이 더 새것
  assert(by.e);                             // 지운 뒤 다시 만든 것은 남김
  assert.deepStrictEqual(r.del, { d: 6, b: 7, e: 0 });
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

// 절 구분표: 66권, 1189장, 31102절, 요 3:16 = 26136번째 줄
assert.strictEqual(VERSES.length, 66);
assert.strictEqual(VERSES.flat().length, 1189);
assert.strictEqual(VERSES.flat().reduce((a, b) => a + b), 31102);
assert.strictEqual(START[43][2] + 15, 26136);
assert.strictEqual(verseHtml('<FR>a<Fr> <세계의 시작> <x>b'), '<span class="red">a</span> <b class="ts">세계의 시작</b> b');
assert.strictEqual(verseHtml('<FR>a <FI>b'), '<span class="red">a <i>b</i></span>'); // 안 닫힌 태그
// 매튜헨리: Graeca 글꼴 글자가 \uF0xx 로 (lo,goj evndia,qetoj = λόγος ἐνδιάθετος)
{
  const { rtfToHtml } = require('./decode.js');
  const u = s => [...s].map(c => `\\u${0xF000 + c.charCodeAt(0)} ?`).join('');
  const rtf = `{\\rtf1{\\fonttbl{\\f0\\fnil Arial;}{\\f2\\fnil\\fcharset2 Graeca;}}\\f2 ${u('lo,goj evndia,qetoj')}\\f0  - 말}`;
  assert.match(rtfToHtml(rtf), /<span class="grk">λόγος ἐνδιάθετος<\/span>/);
}
// 베들레헴 원전분해(.sdb): 단어·번호·기본형·발음·문법·뜻, 케티브/케레
{
  const { anaWords } = require('./decode.js');
  const [w1, w2] = anaWords('\r[בְּרֵאשִׁית] (기본 <WH7225> [רֵאשִׁית] 레쉬트)@전치사, 명사 여성 단수 # 태초에*\r[כ=וַיִּישֶׂם]] [ק=וַיּוּשַׂם] (기본 <WH3455> [יָשַׂם] 야삼)@와우 계속법 # _*');
  assert.deepStrictEqual(w1, { word: 'בְּרֵאשִׁית', ketiv: '', num: 'H7225', lemma: 'רֵאשִׁית', say: '레쉬트', morph: '전치사, 명사 여성 단수', gloss: '태초에' });
  assert.deepStrictEqual([w2.word, w2.ketiv, w2.num, w2.gloss], ['וַיּוּשַׂם', 'וַיִּישֶׂם', 'H3455', '']);
}
// 강조·클릭은 단어에만: 앞 단어의 마켑(־), 단락 표시(פ), 케티브는 단어 밖
assert.match(verseHtml('עַל<WH5921>־פְּנֵי<WH6440>'), /־<span class="w" data-strong="H6440">פְּנֵי<\/span>$/);
assert.match(verseHtml("אֶחָֽד׃ פ <TRANS>ʔeḥˈāḏ<trans> <sub><font color='gray'>אֶחָד one</font></sub>"), /data-lemma="אֶחָד"[^>]*>אֶחָֽד׃<\/span> פ /);
assert.match(verseHtml("<font color='blue'>אָהֳלֹֽו</font> <sub>אהלה</sub> <TRANS>ʔohᵒlˈô<trans> <sub><font color='gray'>אֹהֶל tent</font></sub>"), /data-lemma="אֹהֶל"[^>]*>אָהֳלֹֽו<\/span> <span class="kt">\[אהלה\]<\/span>/);
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
