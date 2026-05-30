# beepbeep 배포 가이드

## 준비물
- GitHub 계정 (무료)
- Supabase 계정 (무료): https://supabase.com
- Vercel 계정 (무료): https://vercel.com

---

## 1단계: Supabase 세팅 (10분)

1. https://supabase.com 가입 후 새 프로젝트 생성
2. 프로젝트 이름: beepbeep, 비밀번호 설정, 지역: Northeast (US East)
3. 왼쪽 메뉴 → SQL Editor → `supabase_schema.sql` 파일 내용 전체 복붙 → Run
4. 왼쪽 메뉴 → Settings → API
   - Project URL 복사 → `REACT_APP_SUPABASE_URL`
   - anon public key 복사 → `REACT_APP_SUPABASE_ANON_KEY`

---

## 2단계: GitHub에 코드 올리기 (5분)

1. https://github.com 에서 새 repository 생성 (이름: beepbeep)
2. 아래 명령어 실행 (터미널 또는 GitHub Desktop):

```bash
cd beepbeep
git init
git add .
git commit -m "beepbeep first commit"
git remote add origin https://github.com/YOUR_USERNAME/beepbeep.git
git push -u origin main
```

---

## 3단계: Vercel 배포 (5분)

1. https://vercel.com 가입 → Import Project → GitHub repository 선택
2. Framework: Create React App
3. Environment Variables 추가:
   - `REACT_APP_SUPABASE_URL` = Supabase Project URL
   - `REACT_APP_SUPABASE_ANON_KEY` = Supabase anon key
4. Deploy 클릭!

배포 완료되면 `beepbeep.vercel.app` 같은 링크가 생겨요.

---

## 4단계: 폰에서 테스트

1. 폰 크롬에서 배포된 링크 접속
2. 가입 → 프로필 설정
3. 와이프 폰으로도 동일하게 가입
4. 둘 다 같은 모드 켜기
5. 반경 150m 안에 있으면 알림 울림!

---

## 홈화면에 앱처럼 추가하는 법

### 아이폰:
사파리로 접속 → 하단 공유버튼 → 홈 화면에 추가

### 안드로이드:
크롬으로 접속 → 주소창 옆 메뉴 → 홈 화면에 추가

---

## 문제 생기면?

모르는 것 생기면 Claude한테 물어보세요!
