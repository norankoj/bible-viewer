# 성경 뷰어

성경·주석·원어 사전 파일을 읽는 브라우저용 성경 뷰어입니다. 맥, 윈도우, 아이패드에서 설치 없이 사용할 수 있습니다.

읽을 수 있는 형식 (암호화되지 않은 파일):

| 앱 | 성경 | 주석 | 사전 |
|---|---|---|---|
| theWord | `.ont` `.ot` `.nt` | `.cmt.twm` | `.gbk.twm` `.dct.twm` |
| Bible Analyzer | `.bdb` | | `.dct` |
| MySword | `.bbl.mybible` | | |

## 사용법

1. `index.html`을 브라우저로 엽니다 (또는 웹에 올린 주소로 접속).
2. **파일** 메뉴에서 **폴더 열기** 또는 **파일 선택**으로 가지고 있는 `.ont`, `.cmt.twm` 파일을 불러옵니다.
3. 한 번 불러오면 브라우저에 저장되어 다음부터 자동으로 열립니다.

파일은 사용자의 브라우저 안에서만 읽히며 어디에도 전송되지 않습니다.

## 앱으로 설치

배포된 사이트에서 **파일 → 앱으로 설치**를 누르면 바탕화면·시작 메뉴에 아이콘이 생기고, 주소창 없는 독립 창으로 열리며 인터넷 없이도 열립니다.

- Chrome·Edge: 주소창 오른쪽의 설치 아이콘 또는 메뉴 > "앱 설치"
- Safari(맥): 파일 메뉴 > "Dock에 추가"
- 아이폰·아이패드 Safari: 공유 버튼 > "홈 화면에 추가"

## 기능

- 성경 본문과 주석을 나란히 보기, 절을 고르면 주석이 따라감
- 여러 번역본 대조 보기
- 주석 두 개 나란히 보기 (2단 보기)
- 성경·주석 검색
- 구절 복사, 하이라이트, 메모, 책갈피, 뒤로가기, 최근 본 곳
- 메모·책갈피 백업과 불러오기, 백업 알림
- 주석 속 성경 참조에 마우스를 올리면 본문 미리보기

## 성경·주석 데이터

이 저장소에는 성경·주석 데이터가 들어 있지 않습니다. 개역개정, 표준새번역, 호크마 주석 등 저작권이 있는 자료는 각자 정식으로 구입하거나 이용 허가를 받은 파일을 사용하세요.

## 개발

```bash
node test.js "<주석.cmt.twm 경로>" "<성경.ont 경로>"
```

## 사용한 라이브러리

- [sql.js](https://github.com/sql-js/sql.js) (MIT, `vendor/sql.js-LICENSE.txt`)
- [Pretendard](https://github.com/orioncactus/pretendard) (SIL Open Font License 1.1, `vendor/Pretendard-LICENSE.txt`)
- 교차 참조: [OpenBible.info](https://www.openbible.info/labs/cross-references/) (CC BY 4.0). `node tools/build-xrefs.js cross_references.txt`로 `data/xrefs.js`를 다시 만들 수 있습니다.
- 원어 단어 번호: [STEPBible](https://github.com/STEPBible/STEPBible-Data) TAHOT·TAGNT (Tyndale House, CC BY 4.0). 번호가 없는 히브리어·헬라어 성경(BHS 등)의 단어를 눌러 사전을 볼 수 있게 합니다. `node tools/build-orig.js <TAHOT 4개> <TAGNT 2개>`로 `data/orig-ot.js`·`data/orig-nt.js`를 다시 만들 수 있습니다.
