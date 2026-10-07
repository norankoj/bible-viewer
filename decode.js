// theWord 주석 본문(RTF 또는 TRichView RVF)을 HTML로 변환
const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const SKIP = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'header', 'footer']);
const href = tag => (tag.match(/HYPERLINK\s+"([^"]*)"/) || [])[1] || null;

/* ---------- 크로스 히브라이카/그라에카(옛 전용 글꼴) → 유니코드 ----------
   StrongBniel 등 한국 사전은 원어를 이 글꼴의 영문 자판 글자로 적어 둠.
   대응표는 스트롱 사전 표제어 14,000여 개와 맞대어 만들고 검증함 (히브리어 96%, 헬라어 97% 글자 일치) */
const DAG = 'ּ', HOLAM = 'ֹ';
const HEB_CONS = {
  a: 'א', b: 'ב', g: 'ג', d: 'ד', h: 'ה', w: 'ו', z: 'ז', j: 'ח', f: 'ט', y: 'י', k: 'כ', l: 'ל', m: 'מ', '!': 'ם', n: 'נ',
  '@': 'ן', s: 'ס', '[': 'ע', p: 'פ', '#': 'ף', x: 'צ', $: 'ץ', q: 'ק', r: 'ר', t: 'ת', '`': 'ש', v: 'שׁ', c: 'שׂ',
  '&': 'ךְ', ')': 'ךְ', '/': 'ו' + HOLAM,
  // 대문자 = 다게쉬가 찍힌 자음
  B: 'ב' + DAG, G: 'ג' + DAG, D: 'ד' + DAG, '+': 'ד' + DAG, H: 'ה' + DAG, W: 'ו' + DAG, Z: 'ז' + DAG, F: 'ט' + DAG, Y: 'י' + DAG,
  K: 'כ' + DAG, L: 'ל' + DAG, M: 'מ' + DAG, N: 'נ' + DAG, S: 'ס' + DAG, P: 'פ' + DAG, X: 'צ' + DAG, Q: 'ק' + DAG, R: 'ר' + DAG,
  T: 'ת' + DAG, V: 'ש' + DAG + 'ׁ', C: 'ש' + DAG + 'ׂ',
};
const HEB_MARK = {
  ';': 'ָ', ':': 'ָ', "'": 'ַ', '"': 'ַ', ']': 'ְ', '}': 'ֲ', '>': 'ֱ', '?': 'ֳ', i: 'ִ', I: 'ִ',
  e: 'ֵ', E: 'ֵ', ',': 'ֶ', '<': 'ֶ', o: HOLAM, O: HOLAM, u: 'ֻ', U: 'ֻ',
};
const HEB_SEP = { ' ': ' ', '-': '־', A: '־' };
// 화면 순서(왼→오)로 저장돼 있어 [자음+부호] 묶음으로 나눈 뒤 묶음 순서를 뒤집음.
// 대문자 O(홀렘)는 다음(오른쪽) 자음의 점. 단 앞이 ו면 홀렘 바브.
function crossHebrew(s) {
  const cl = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (HEB_CONS[ch]) cl.push(HEB_CONS[ch]);
    else if (HEB_SEP[ch]) cl.push(HEB_SEP[ch]);
    else if (HEB_MARK[ch]) {
      const prevIsVav = cl.length && cl[cl.length - 1][0] === 'ו';
      if (ch === 'O' && !prevIsVav && HEB_CONS[s[i + 1]]) { cl.push(HEB_CONS[s[++i]] + HOLAM); continue; }
      if (cl.length) cl[cl.length - 1] += HEB_MARK[ch]; else cl.push(HEB_MARK[ch]);
    } else cl.push(ch);
  }
  // 카메츠를 파타흐(')+점(;)으로 겹쳐 찍은 경우 → 카메츠 하나로
  return cl.reverse().map(c => c.includes('ָ') ? c.replace('ַ', '') : c).join('').normalize('NFC');
}
const GRK = {
  a: 'α', b: 'β', g: 'γ', d: 'δ', e: 'ε', z: 'ζ', h: 'η', q: 'θ', i: 'ι', k: 'κ', l: 'λ', m: 'μ', n: 'ν', x: 'ξ', o: 'ο', p: 'π',
  r: 'ρ', s: 'σ', '"': 'ς', t: 'τ', u: 'υ', f: 'φ', c: 'χ', y: 'ψ', w: 'ω',
  A: 'Α', B: 'Β', G: 'Γ', D: 'Δ', E: 'Ε', Z: 'Ζ', H: 'Η', Q: 'Θ', I: 'Ι', K: 'Κ', L: 'Λ', M: 'Μ', N: 'Ν', X: 'Ξ', O: 'Ο', P: 'Π',
  R: 'Ρ', S: 'Σ', T: 'Τ', U: 'Υ', F: 'Φ', C: 'Χ', Y: 'Ψ', W: 'Ω',
  j: '̓', J: '̔', v: '́', ';': '̀', "'": '͂', '/': 'ͅ', '>': '̈', '?': '̈́', '<': '-',
  // 숨표+강세를 한 글자로 쓴 것 (!, @, #, $ 는 대문자 앞에 옴)
  '[': '̓́', '{': '̔́', '}': '̔́', '+': '̓', '|': '̔͂', '!': '̓', '@': '̔', '#': '̓́', $: '̔́',
};
const crossGreek = s => [...s].map(ch => GRK[ch] ?? ch).join('')
  .replace(/([̀-ͯ]+)([Α-Ω])/g, '$2$1') // 대문자 앞의 숨표·강세를 대문자 뒤로
  .normalize('NFC');
// 글꼴 이름 → 변환 종류
const crossKind = name => /HEBRAICA/i.test(name) ? 'heb' : /GRAECA/i.test(name) ? 'grk' : null;

function rtfToHtml(s) {
  const colors = ((s.match(/\{\\colortbl;([^}]*)\}/) || [])[1] || '').split(';').map(c => {
    const m = c.match(/\\red(\d+)\\green(\d+)\\blue(\d+)/);
    return m && (m[1] | m[2] | m[3]) ? `rgb(${m[1]},${m[2]},${m[3]})` : '';
  });
  // 글꼴 번호 → 크로스 원어 글꼴인지
  const fonts = {};
  for (const m of (s.match(/\{\\fonttbl[\s\S]*?\}\}/)?.[0] || '').matchAll(/\{\\f(\d+)[^ ;]* ([^;{}]*);\}/g)) fonts[m[1]] = crossKind(m[2]);
  const dec = new TextDecoder('euc-kr');
  const re = /\\(?:([a-zA-Z]+)(-?\d+)? ?|'([0-9a-fA-F]{2})|([\s\S]))/y;
  let out = '', cur = '', close = '', bytes = [], stack = [], skipChars = 0;
  let st = { b: 0, cf: 0, fs: 20, f: 0, uc: 1, link: null, href: null, skip: false, star: false, inst: null };

  const emit = (t, cls) => {
    if (st.inst !== null) { st.inst += t; return; }
    if (st.skip || !t) return;
    const key = [st.b, st.cf, st.fs > 22, st.link].join('|');
    if (key !== cur) {
      const color = !st.link && colors[st.cf - 1];
      // 원본 글자색(원색 파랑·빨강 등)은 앱의 강조색 하나로 통일
      const style = (st.b ? 'font-weight:bold;' : '') + (color ? 'color:var(--accent);' : '') + (st.fs > 22 ? 'font-size:1.15em;' : '');
      out += close + (st.link ? `<a href="#" data-ref="${esc(st.link)}">` : '') + `<span style="${style}">`;
      cur = key; close = '</span>' + (st.link ? '</a>' : '');
    }
    out += cls ? `<span class="${cls}"${cls === 'heb' ? ' dir="rtl"' : ''}>${esc(t)}</span>` : esc(t);
  };
  const flush = () => {
    if (!bytes.length) return;
    const b = bytes; bytes = [];
    const kind = fonts[st.f];
    if (!kind) return emit(dec.decode(new Uint8Array(b)));
    const [, pre, word, post] = String.fromCharCode(...b).match(/^(\s*)([\s\S]*?)(\s*)$/); // 앞뒤 공백은 뒤집지 않음
    emit(pre); emit(kind === 'heb' ? crossHebrew(word) : crossGreek(word), kind); emit(post);
  };
  const par = () => { flush(); if (!st.skip && st.inst === null) { out += close + '<br>'; cur = close = ''; } };

  for (let i = 0; i < s.length;) {
    const c = s[i];
    if (c === '{') { flush(); stack.push(st); st = { ...st, star: false }; i++; continue; }
    if (c === '}') {
      flush();
      const done = st; st = stack.pop() || st;
      if (done.inst !== null && st.inst === null) st.href = href(done.inst);
      i++; continue;
    }
    if (c !== '\\') {
      i++;
      if (c === '\r' || c === '\n') continue;
      if (skipChars) { skipChars--; continue; }
      const code = c.charCodeAt(0);
      if (code < 128) bytes.push(code); else { flush(); emit(c); }
      continue;
    }
    re.lastIndex = i;
    const m = re.exec(s);
    if (!m) { i++; continue; }
    i = re.lastIndex;
    if (m[3]) { if (skipChars) skipChars--; else bytes.push(parseInt(m[3], 16)); continue; }
    // \\ \{ \} 는 글자 그대로: 원어 글꼴 단어(예: 하테프 파타흐 '}') 중간에서 끊기지 않게 같은 묶음에 넣음
    if (m[4] === '\\' || m[4] === '{' || m[4] === '}') { bytes.push(m[4].charCodeAt(0)); continue; }
    flush();
    if (m[4]) {
      const sym = m[4];
      if (sym === '*') st.star = true;
      else if (sym === '~') emit(' ');
      else if (sym === '_') emit('-');
      else if (sym === '\n' || sym === '\r') par();
      continue;
    }
    const w = m[1], n = m[2];
    if (st.star) { st.star = false; if (w === 'fldinst') st.inst = ''; else st.skip = true; continue; }
    switch (w) {
      case 'u': { let code = +n; if (code < 0) code += 65536; emit(String.fromCharCode(code)); skipChars = st.uc; break; }
      case 'uc': st.uc = +n; break;
      case 'par': case 'line': par(); break;
      case 'tab': emit(' '); break;
      case 'b': st.b = n !== '0'; break;
      case 'cf': st.cf = +n; break;
      case 'fs': st.fs = +n; break;
      case 'plain': st.b = 0; st.cf = 0; st.fs = 20; st.f = 0; break;
      case 'f': st.f = +n; break;
      case 'fldrslt': st.link = st.href; break;
      default: if (SKIP.has(w)) st.skip = true;
    }
  }
  flush();
  return out + close;
}

// TRichView 형식: ASCII 항목 헤더 줄 + UTF-16LE 본문이 번갈아 나옴
function rvfToHtml(u8) {
  const s = bytesToStr(u8);
  const styles = s.slice(0, s.indexOf('-9 2 0 0 2 0 2')).split('StyleName').slice(1);
  const bold = styles.map(x => x.includes('fsBold'));
  const jump = styles.map(x => x.includes('Jump\x09')); // 링크 스타일만 태그를 링크로 취급
  const utf16 = new TextDecoder('utf-16le');
  // 첫 헤더는 \0 뒤, 이후 헤더는 ") " 뒤에 옴
  const items = [...s.matchAll(/(?<=\x00|\) )(-?\d+) (\d+) (-?\d+) (\d+) (\d+) (0|"[^"\r\n]*")\r\n/g)];
  let out = '';
  items.forEach((m, k) => {
    const style = +m[1];
    if (style < 0) return;
    const start = m.index + m[0].length;
    let end = u8.length;
    if (k + 1 < items.length) { end = items[k + 1].index; if (s.slice(end - 2, end) === ') ') end -= 2; }
    const text = esc(utf16.decode(u8.subarray(start, end)));
    if (m[3] !== '-1' && out) out += '<br>';
    const link = jump[style] && m[6].startsWith('"tw://') ? m[6].slice(1, -1) : null;
    const inner = bold[style] ? `<b>${text}</b>` : text;
    out += link ? `<a href="#" data-ref="${esc(link)}">${inner}</a>` : inner;
  });
  return out;
}

// 바이트 1개 = 문자 1개 (오프셋 유지)
function bytesToStr(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
  return s;
}

function toHtml(u8) {
  return u8[0] === 0x7b ? rtfToHtml(bytesToStr(u8)) : rvfToHtml(u8);
}

// tw://bible.*?id=43.3.16 → [43, 3, 16]
const parseRef = r => (r.match(/id=(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number);

// KJV 절 구분 (theWord .ont 파일은 한 줄에 한 절씩 31102줄)
const VERSES = `31 25 24 26 32 22 24 22 29 32 32 20 18 24 21 16 27 33 38 18 34 24 20 67 34 35 46 22 35 43 55 32 20 31 29 43 36 30 23 23 57 38 34 34 28 34 31 22 33 26
|22 25 22 31 23 30 25 32 35 29 10 51 22 31 27 36 16 27 25 26 36 31 33 18 40 37 21 43 46 38 18 35 23 35 35 38 29 31 43 38
|17 16 17 35 19 30 38 36 24 20 47 8 59 57 33 34 16 30 37 27 24 33 44 23 55 46 34
|54 34 51 49 31 27 89 26 23 36 35 16 33 45 41 50 13 32 22 29 35 41 30 25 18 65 23 31 40 16 54 42 56 29 34 13
|46 37 29 49 33 25 26 20 29 22 32 32 18 29 23 22 20 22 21 20 23 30 25 22 19 19 26 68 29 20 30 52 29 12
|18 24 17 24 15 27 26 35 27 43 23 24 33 15 63 10 18 28 51 9 45 34 16 33
|36 23 31 24 31 40 25 35 57 18 40 15 25 20 20 31 13 31 30 48 25
|22 23 18 22
|28 36 21 22 12 21 17 22 27 27 15 25 23 52 35 23 58 30 24 42 15 23 29 22 44 25 12 25 11 31 13
|27 32 39 12 25 23 29 18 13 19 27 31 39 33 37 23 29 33 43 26 22 51 39 25
|53 46 28 34 18 38 51 66 28 29 43 33 34 31 34 34 24 46 21 43 29 53
|18 25 27 44 27 33 20 29 37 36 21 21 25 29 38 20 41 37 37 21 26 20 37 20 30
|54 55 24 43 26 81 40 40 44 14 47 40 14 17 29 43 27 17 19 8 30 19 32 31 31 32 34 21 30
|17 18 17 22 14 42 22 18 31 19 23 16 22 15 19 14 19 34 11 37 20 12 21 27 28 23 9 27 36 27 21 33 25 33 27 23
|11 70 13 24 17 22 28 36 15 44
|11 20 32 23 19 19 73 18 38 39 36 47 31
|22 23 15 17 14 14 10 17 32 3
|22 13 26 21 27 30 21 22 35 22 20 25 28 22 35 22 16 21 29 29 34 30 17 25 6 14 23 28 25 31 40 22 33 37 16 33 24 41 30 24 34 17
|6 12 8 8 12 10 17 9 20 18 7 8 6 7 5 11 15 50 14 9 13 31 6 10 22 12 14 9 11 12 24 11 22 22 28 12 40 22 13 17 13 11 5 26 17 11 9 14 20 23 19 9 6 7 23 13 11 11 17 12 8 12 11 10 13 20 7 35 36 5 24 20 28 23 10 12 20 72 13 19 16 8 18 12 13 17 7 18 52 17 16 15 5 23 11 13 12 9 9 5 8 28 22 35 45 48 43 13 31 7 10 10 9 8 18 19 2 29 176 7 8 9 4 8 5 6 5 6 8 8 3 18 3 3 21 26 9 8 24 13 10 7 12 15 21 10 20 14 9 6
|33 22 35 27 23 35 27 36 18 32 31 28 25 35 33 33 28 24 29 30 31 29 35 34 28 28 27 28 27 33 31
|18 26 22 16 20 12 29 17 18 20 10 14
|17 17 11 16 16 13 13 14
|31 22 26 6 30 13 25 22 21 34 16 6 22 32 9 14 14 7 25 6 17 25 18 23 12 21 13 29 24 33 9 20 24 17 10 22 38 22 8 31 29 25 28 28 25 13 15 22 26 11 23 15 12 17 13 12 21 14 21 22 11 12 19 12 25 24
|19 37 25 31 31 30 34 22 26 25 23 17 27 22 21 21 27 23 15 18 14 30 40 10 38 24 22 17 32 24 40 44 26 22 19 32 21 28 18 16 18 22 13 30 5 28 7 47 39 46 64 34
|22 22 66 22 22
|28 10 27 17 17 14 27 18 11 22 25 28 23 23 8 63 24 32 14 49 32 31 49 27 17 21 36 26 21 26 18 32 33 31 15 38 28 23 29 49 26 20 27 31 25 24 23 35
|21 49 30 37 31 28 28 27 27 21 45 13
|11 23 5 19 15 11 16 14 17 15 12 14 16 9
|20 32 21
|15 16 15 13 27 14 17 14 15
|21
|17 10 10 11
|16 13 12 13 15 16 20
|15 13 19
|17 20 19
|18 15 20
|15 23
|21 13 10 14 11 15 14 23 17 12 17 14 9 21
|14 17 18 6
|25 23 17 25 48 34 29 34 38 42 30 50 58 36 39 28 27 35 30 34 46 46 39 51 46 75 66 20
|45 28 35 41 43 56 37 38 50 52 33 44 37 72 47 20
|80 52 38 44 39 49 50 56 62 42 54 59 35 35 32 31 37 43 48 47 38 71 56 53
|51 25 36 54 47 71 53 59 41 42 57 50 38 31 27 33 26 40 42 31 25
|26 47 26 37 42 15 60 40 43 48 30 25 52 28 41 40 34 28 41 38 40 30 35 27 27 32 44 31
|32 29 31 25 21 23 25 39 33 21 36 21 14 23 33 27
|31 16 23 21 13 20 40 13 27 33 34 31 13 40 58 24
|24 17 18 18 21 18 16 24 15 18 33 21 14
|24 21 29 31 26 18
|23 22 21 32 33 24
|30 30 21 23
|29 23 25 18
|10 20 13 18 28
|12 17 18
|20 15 16 16 25 21
|18 26 17 22
|16 15 15
|25
|14 18 19 16 14 20 28 13 28 39 40 29 25
|27 26 18 17 20
|25 25 22 19 14
|21 22 18
|10 29 24 21 21
|13
|14
|25
|20 29 22 11 14 17 17 13 21 11 19 17 18 20 8 21 18 24 21 15 27 21`.split('|').map(b => b.trim().split(/\s+/).map(Number));

// START[책][장-1] = 그 장 1절의 줄 번호(0부터)
const START = [];
VERSES.reduce((n, cs, b) => { START[b + 1] = cs.map(v => (n += v) - v); return n; }, 0);

// .ont(신구약) / .ot(구약만) / .nt(신약만) 파일 → 31102절 배열 (UTF-8이 아니면 EUC-KR로 읽음)
// 오른쪽에서 왼쪽으로 쓰는 본문(히브리어 등)이면 배열에 rtl = true
const OT_VERSES = 23145;
function parseOnt(u8, kind = 'ont') {
  let t;
  try { t = new TextDecoder('utf-8', { fatal: true }).decode(u8); } catch { t = new TextDecoder('euc-kr').decode(u8); }
  const lines = t.replace(/^﻿/, '').split(/\r?\n/);
  const n = kind === 'ot' ? OT_VERSES : kind === 'nt' ? 31102 - OT_VERSES : 31102;
  const out = new Array(31102).fill('');
  out.splice(kind === 'nt' ? OT_VERSES : 0, n, ...lines.slice(0, n));
  out.rtl = lines.slice(n).some(l => /^r2l\s*=\s*1/.test(l.trim()));
  return out;
}

// theWord 절 태그 → HTML. 모르는 태그는 지우고, <한글 소제목>은 소제목으로 표시
// 대문자로 열고 소문자로 닫는 theWord 태그 + 일부 HTML 태그(<sub>, <font>)
const TAGS = {
  FR: '<span class="red">', Fr: '</span>', FI: '<i>', Fi: '</i>', FO: '<span class="ot">', Fo: '</span>', TS: '<b class="ts">', Ts: '</b>',
  TRANS: '<span class="tr">', trans: '</span>', K: '<span class="kt">[', k: ']</span>', R: '<span class="qr">', r: '</span>', // 음역, 케티브/케레
  sub: '<span class="gl">', '/sub': '</span>', font: '', '/font': '', // 기본형·뜻
};
const tagHtml = t => esc(t)
  // 스트롱 번호 태그: 단어<WH430><WH853> → 누르면 사전이 뜨는 단어
  .replace(/(\S+?)((?:&lt;W[HG]\d+[a-z]?&gt;)+)/g, (_, w, tags) =>
    `<span class="w" data-strong="${[...tags.matchAll(/W([HG])(\d+)/g)].map(m => m[1] + +m[2]).join(',')}">${w}</span>`)
  .replace(/&lt;(\/?[A-Za-z]+)(?:(?!&gt;).)*&gt;/g, (_, k) => TAGS[k] || '')
  .replace(/&lt;([^&]+)&gt;/g, '<b class="ts">$1</b>');

// BHS 형식: 원어 <TRANS>음역<trans> <sub><font…>기본형 뜻</font></sub> → 기본형으로 사전을 찾는 단어
const BHS_WORD = /(\S+) <TRANS>([\s\S]*?)<trans> <sub>(?:<font[^>]*>)?([\s\S]*?)(?:<\/font>)?<\/sub>/g;
const bhsWord = ([, word, tr, gloss]) => {
  const lemma = gloss.match(/^[֐-׿]+/)?.[0] || '';
  const en = gloss.slice(lemma.length).replace(/[^\sA-Za-z-]/g, '').trim(); // 영어 뜻 (후보 순서 정할 때 씀)
  return `<span class="w"${lemma ? ` data-lemma="${esc(lemma)}" data-gloss="${esc(en)}"` : ''}>${esc(word)}</span> <span class="tr">${esc(tr)}</span> <span class="gl">${esc(gloss)}</span>`;
};

/* ---------- 각주 ----------
   ① theWord 표준: 본문<RF>각주<Rf>
   ② 표준새번역 등 내보낸 본문: 본문 속 "b하나님의 영은…" 표시 + 절 끝 "(b 또는 '하나님의 바람' c …)"
   각주 자리는 \u0001번호\u0001 로 표시해 두고, 화면에서는 누르는 위첨자로 바꿈 */
const FN = /\u0001(\d+)\u0001/g;
function splitNotes(t) {
  const notes = [];
  t = t.replace(/<RF[^>]*>([\s\S]*?)<Rf>/g, (_, n) => {
    notes.push({ label: String(notes.length + 1), text: n.replace(/<[^>]*>/g, '').trim() });
    return `\u0001${notes.length - 1}\u0001`;
  });
  const m = t.match(/\(([a-z]) ((?:[^()]|\([^()]*\))*)\)\s*$/); // 절 끝 괄호 (안에 괄호 한 겹까지)
  if (m) {
    const byLabel = {};
    for (const part of (m[1] + ' ' + m[2]).split(/ (?=[a-z] )/)) byLabel[part[0]] = part.slice(2).trim();
    const start = notes.length;
    // 본문의 표시: 앞이 처음·공백·문장부호이고 바로(또는 한 칸 띄고) 뒤가 한글·따옴표인 소문자 하나
    const body = t.slice(0, m.index).replace(/(^|[\s"'“‘(\]])([a-z])(?=\s?[가-힣"'“‘(])/g, (all, pre, l) => {
      if (byLabel[l] == null) return all;
      notes.push({ label: l, text: byLabel[l] });
      return `${pre}\u0001${notes.length - 1}\u0001`;
    });
    if (notes.length > start) t = body.trimEnd(); // 표시를 하나도 못 찾았으면 원래대로 둠
  }
  return { t, notes };
}
const fnHtml = (h, notes) => h.replace(FN, (_, i) =>
  `<sup class="fn" tabindex="0" title="${esc(notes[i].text)}" data-fn="${esc(notes[i].text)}">${esc(notes[i].label)}</sup>`);

// theWord는 <FR> 등을 절 끝에서 안 닫는 경우가 많음 → 절 단위로 닫아줌
function verseHtml(raw) {
  const { t, notes } = splitNotes(raw);
  let h = '', last = 0;
  for (const m of t.matchAll(BHS_WORD)) { h += tagHtml(t.slice(last, m.index)) + bhsWord(m); last = m.index + m[0].length; }
  h = fnHtml(h + tagHtml(t.slice(last)), notes);
  const open = tag => (h.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length - (h.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  return h + '</i>'.repeat(Math.max(0, open('i'))) + '</span>'.repeat(Math.max(0, open('span')));
}

// 사전 항목 HTML의 첫 원어 단어(표제어)
const headword = html => html.match(/<span class="(?:heb|grk)"[^>]*>([^<]+)</)?.[1] || '';
// 원어 비교용 열쇠: 모음·억양·숨표 부호와 공백·마켑을 빼고 글자만 (ς→σ)
const lemmaKey = s => s.normalize('NFD').replace(/[֑-ׇ̀-ͯ]/g, '').replace(/[\s־]/g, '').replace(/ς/g, 'σ').toLowerCase();
// 정확히 맞는 게 없을 때: 모음 보조 글자(ו, י)를 쓰고 안 쓰는 철자 차이(אַהֲרֹן / אַהֲרוֹן)까지 같게
const looseKey = s => lemmaKey(s).replace(/[וי]/g, '');
// 모음까지 같은지 (억양·메텍 부호만 빼고, 카메츠 하투프 = 카메츠)
const vowelKey = s => s.normalize('NFD').replace(/[֑-ֽ֯׀׃]/g, '').replace(/ׇ/g, 'ָ').replace(/[\s־]/g, '').normalize('NFC');

// 사전 표제어 [{s: 'H430', h: 'אֱלֹהִים'}, …] → 원어 기본형으로 스트롱 번호 후보 찾기.
// 모음까지 같은 것 → 글자만 같은 것 → 보조 글자 차이까지 무시 순으로 (동음이의어는 후보 여러 개)
function lemmaFinder(entries) {
  const maps = { v: new Map(), k: new Map(), l: new Map() };
  const add = (m, key, s) => { if (key) m.set(key, [...(m.get(key) || []), s]); };
  for (const { s, h } of entries) {
    if (!h) continue;
    add(maps.v, vowelKey(h), s); add(maps.k, lemmaKey(h), s);
    if (looseKey(h).length > 1) add(maps.l, looseKey(h), s);
  }
  return lemma => maps.v.get(vowelKey(lemma)) || maps.k.get(lemmaKey(lemma)) || (looseKey(lemma).length > 1 && maps.l.get(looseKey(lemma))) || [];
}

// 복사·검색용 글자만 (각주·음역·기본형 풀이는 빼고, 태그 제거)
const plainVerse = s => splitNotes(s || '').t.replace(FN, '')
  .replace(/<TRANS>[\s\S]*?<trans>/g, '').replace(/<sub>[\s\S]*?<\/sub>/g, '')
  .replace(/<[^>]*>/g, '').replace(/¶\s*/g, '').replace(/\s+/g, ' ').trim();

// ESV API 요청 (브라우저와 Vercel 서버 함수가 함께 씀)
const EN = 'Genesis Exodus Leviticus Numbers Deuteronomy Joshua Judges Ruth 1_Samuel 2_Samuel 1_Kings 2_Kings 1_Chronicles 2_Chronicles Ezra Nehemiah Esther Job Psalm Proverbs Ecclesiastes Song_of_Solomon Isaiah Jeremiah Lamentations Ezekiel Daniel Hosea Joel Amos Obadiah Jonah Micah Nahum Habakkuk Zephaniah Haggai Zechariah Malachi Matthew Mark Luke John Acts Romans 1_Corinthians 2_Corinthians Galatians Ephesians Philippians Colossians 1_Thessalonians 2_Thessalonians 1_Timothy 2_Timothy Titus Philemon Hebrews James 1_Peter 2_Peter 1_John 2_John 3_John Jude Revelation'.split(' ').map(s => s.replace(/_/g, ' '));
const esvQuery = (b, c) => new URLSearchParams({
  q: `${EN[b - 1]} ${c}:1-${VERSES[b - 1][c - 1]}`, // 범위를 적어야 유다서처럼 한 장짜리 책도 1절이 아니라 장 전체가 옴
  'include-passage-references': false, 'include-verse-numbers': true, 'include-first-verse-numbers': true,
  'include-footnotes': false, 'include-headings': false, 'include-short-copyright': false, 'indent-poetry': false, 'indent-paragraphs': 0,
}).toString();

// ESV API 본문("[16] For God so loved… [17] …") → 절 배열 (index = 절-1)
function parseEsv(t) {
  const out = [], parts = t.split(/\[(\d+)\]/);
  for (let i = 1; i < parts.length; i += 2) out[+parts[i] - 1] = parts[i + 1].replace(/\s+/g, ' ').trim();
  return out;
}

if (typeof module !== 'undefined') module.exports = { toHtml, rtfToHtml, rvfToHtml, parseRef, VERSES, START, parseOnt, verseHtml, parseEsv, EN, esvQuery, plainVerse, crossHebrew, crossGreek, headword, lemmaKey, lemmaFinder };
