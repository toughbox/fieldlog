# ⚡ FieldLog 빠른 시작 가이드

## 🎯 로컬과 운영 환경 설정 완료!

축하합니다! 프로젝트에 로컬/운영 환경 설정이 완벽하게 구축되었습니다.

---

## 📋 설정된 내용

### ✅ 환경별 주소 구성
| 환경 | 프론트엔드 | 백엔드 API |
|------|-----------|-----------|
| **로컬** | localhost:8081 | localhost:3030 |
| **운영** | toughdev.cafe24.com | toughdev.cafe24.com:3030 |

### ✅ 생성된 파일
- ✔️ `.gitignore` - 환경 파일 보호
- ✔️ `backend/package.json` - 백엔드 스크립트 추가
- ✔️ `package.json` - 프론트엔드 스크립트 추가
- ✔️ `scripts/create-env-files.ps1` - Windows 환경 파일 생성 스크립트
- ✔️ `scripts/create-env-files.sh` - Linux/Mac 환경 파일 생성 스크립트
- ✔️ `ENVIRONMENT_SETUP.md` - 상세 환경 설정 가이드
- ✔️ `DEPLOYMENT_GUIDE.md` - 배포 가이드
- ✔️ `README.md` - 업데이트된 프로젝트 문서

---

## 🚀 지금 바로 시작하기 (3단계)

### 1단계: 환경 파일 생성 ⚙️

#### Windows (PowerShell)
```powershell
.\scripts\create-env-files.ps1
```

#### Linux/Mac
```bash
chmod +x scripts/create-env-files.sh
./scripts/create-env-files.sh
```

### 2단계: 로컬 개발 시작 💻

```bash
# 터미널 1 - 백엔드 서버
cd backend
npm run dev:local

# 터미널 2 - 프론트엔드 앱
npm run start:local
```

### 3단계: 테스트 ✅

```bash
# 백엔드 Health Check
curl http://localhost:3030/api/health

# 앱에서 로그인 테스트
```

---

## 🌐 운영 서버 배포하기

### 방법 1: SSH로 직접 배포

```bash
# 1. 서버 접속
ssh your_username@toughdev.cafe24.com

# 2. 프로젝트 디렉토리로 이동
cd /path/to/fieldlog

# 3. 최신 코드 가져오기
git pull origin main

# 4. 백엔드 배포
cd backend
npm install --production
cp .env.production .env
pm2 restart fieldlog-backend

# 5. 확인
curl http://toughdev.cafe24.com:3030/api/health
```

### 방법 2: 로컬에서 운영 환경 빌드

```bash
# Android APK 빌드 (운영용)
npm run android:production

# iOS 빌드 (운영용)
npm run ios:production
```

---

## 📱 유용한 NPM 스크립트

### 프론트엔드
```bash
npm run start:local          # 로컬 환경 (localhost)
npm run start:production     # 운영 환경 (toughdev.cafe24.com)
npm run android:local        # 로컬 Android
npm run android:production   # 운영 Android
npm run ios:local           # 로컬 iOS
npm run ios:production      # 운영 iOS
```

### 백엔드
```bash
npm run dev:local           # 로컬 개발 모드 (nodemon, 자동 재시작)
npm run start:production    # 운영 모드
```

---

## 🔧 환경 설정 수정하기

### 로컬 환경 수정
```bash
# 백엔드
code backend/.env.local

# 프론트엔드
code .env.local
```

### 운영 환경 수정
```bash
# 백엔드
code backend/.env.production

# 프론트엔드
code .env.production
```

---

## ⚠️ 중요 보안 사항

### 1. JWT Secret 생성
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
출력된 값을 `backend/.env.production`의 `JWT_SECRET`에 사용하세요.

### 2. 운영 환경 비밀번호 변경
- `backend/.env.production` 파일 열기
- `DB_PASSWORD` 변경
- `JWT_SECRET` 변경
- `JWT_REFRESH_SECRET` 변경
- `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` 변경

### 3. Git에서 제외
다음 파일들은 **절대** Git에 커밋하지 마세요:
- ❌ `.env`
- ❌ `.env.local`
- ❌ `.env.production`
- ❌ `backend/.env`
- ❌ `backend/.env.local`
- ❌ `backend/.env.production`

---

## 🔍 트러블슈팅

### 문제: API 연결 실패
**해결:**
```bash
# 1. 백엔드 서버 실행 확인
curl http://localhost:3030/api/health

# 2. 환경 변수 확인
cat .env.local

# 3. 캐시 삭제 후 재시작
rm -rf node_modules/.cache
npm run start:local
```

### 문제: 환경 변수가 적용되지 않음
**해결:**
```bash
# 프론트엔드
node scripts/copy-env.js local
npm start

# 백엔드
cd backend
node scripts/copy-env.js local
npm run dev
```

---

## 📚 더 자세한 정보

- **환경 설정**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **배포 가이드**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **프로젝트 문서**: [README.md](./README.md)

---

## ✨ 다음 단계

1. ✅ 환경 파일 생성 완료
2. ✅ 로컬 개발 서버 실행
3. ✅ API 연결 테스트
4. ⏳ 기능 개발 시작
5. ⏳ 운영 서버 배포

---

## 💡 팁

### 개발 워크플로우
```bash
# 1. 로컬에서 개발
npm run start:local          # 프론트엔드
cd backend && npm run dev:local  # 백엔드

# 2. 테스트

# 3. Git 커밋 & 푸시
git add .
git commit -m "feat: 새로운 기능"
git push origin main

# 4. 운영 서버 배포
ssh your_username@toughdev.cafe24.com
cd /path/to/fieldlog
git pull
cd backend
pm2 restart fieldlog-backend
```

### 환경 전환
```bash
# 로컬 → 운영 전환
node scripts/copy-env.js production      # 프론트엔드
cd backend
node scripts/copy-env.js production      # 백엔드

# 운영 → 로컬 전환
node scripts/copy-env.js local          # 프론트엔드
cd backend
node scripts/copy-env.js local          # 백엔드
```

---

**🎉 설정이 완료되었습니다! 이제 개발을 시작하세요!**

