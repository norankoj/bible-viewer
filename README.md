# 커피성경

성경·주석·원어 사전 파일을 읽는 브라우저용 성경 뷰어입니다. 맥, 윈도우, 아이패드에서 설치 없이 사용할 수 있습니다.

읽을 수 있는 형식 (암호화되지 않은 파일):

| 앱 | 성경 | 주석 | 사전 |
|---|---|---|---|
| theWord | `.ont` `.ot` `.nt` | `.cmt.twm` | `.gbk.twm` `.dct.twm` |
| MySword | `.bbl.mybible` | | |
| 베들레헴 | `.bdb` `.sdb` | `.sdb` 원전분해 (주석 칸 탭) | `.dct` |

## 사용법

1. 컴퓨터에 폴더를 하나 만들고(이름은 아무거나, 예: `커피성경`) 가지고 있는 성경·주석·사전 파일을 모두 넣습니다. 안에 `성경`, `주석`, `사전`처럼 폴더를 나눠도 됩니다.
2. 웹에 올린 주소로 접속하거나 `index.html`을 브라우저로 엽니다.
3. **폴더 열기**로 1번 폴더를 고릅니다 (몇 개만 넣으려면 **파일 선택**). 안의 파일을 한 번에 불러옵니다.
4. 한 번 불러오면 브라우저에 저장되어 다음부터 자동으로 열립니다. 파일이 늘면 같은 폴더를 다시 열면 됩니다.

파일은 사용자의 브라우저 안에서만 읽히며 어디에도 전송되지 않습니다 (구글 드라이브 연결을 쓰면 본인 드라이브에서 받아 오기만 합니다).

## 구글 드라이브로 여러 기기에서 쓰기 (선택)

1. 구글 드라이브에 `커피성경` 폴더를 만들고 성경·주석·사전 파일을 넣습니다. 함께 사는 가족에게는 이 폴더를 공유해도 됩니다.
2. 커피성경에서 **구글 드라이브에서**(첫 화면) 또는 **설정 → 구글 드라이브 연결**을 누르고 로그인합니다.
3. 폴더의 파일을 받아서 엽니다. 다른 기기에서도 로그인만 하면 같은 파일이 열리고, 메모·책갈피·하이라이트도 맞춰집니다 (드라이브의 앱 전용 숨은 공간에 저장).
4. 파일을 더 넣었으면 **설정 → 최신 성경본 불러오기**를 누릅니다. 새로 생기거나 바뀐 파일만 받습니다.

저작권이 있는 성경·주석은 본인 또는 함께 사는 가족 범위에서만 공유하세요.

운영자 설정: Google Cloud에서 OAuth 클라이언트(웹 애플리케이션)를 만들고 `index.html`의 `GOOGLE_CLIENT_ID`에 넣습니다. 테스트 모드에서는 테스트 사용자로 등록한 계정만 로그인할 수 있습니다.

## 앱으로 설치

배포된 사이트에서 **설정 → 앱으로 설치**를 누르면 바탕화면·시작 메뉴에 아이콘이 생기고, 주소창 없는 독립 창으로 열리며 인터넷 없이도 열립니다.

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
- 배경 화면의 커피 사진: [Mike Kenneally](https://unsplash.com/photos/tNALoIZhqVM) (Unsplash License), `img/bg-coffee.jpg`
- 원어 단어 번호: [STEPBible](https://github.com/STEPBible/STEPBible-Data) TAHOT·TAGNT (Tyndale House, CC BY 4.0). 번호가 없는 히브리어·헬라어 성경(BHS 등)의 단어를 눌러 사전을 볼 수 있게 합니다. `node tools/build-orig.js <TAHOT 4개> <TAGNT 2개>`로 `data/orig-ot.js`·`data/orig-nt.js`를 다시 만들 수 있습니다.
