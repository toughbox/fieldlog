# FieldLog 배포 가이드

## 📋 목차
1. [환경 설정 개요](#환경-설정-개요)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [운영 서버 배포](#운영-서버-배포)
4. [환경 변수 관리](#환경-변수-관리)
5. [배포 체크리스트](#배포-체크리스트)

---

## 🎯 환경 설정 개요

### 환경 파일 구조
```
fieldlog/
├── .env.local              # 프론트엔드 로컬 환경
├── .env.production         # 프론트엔드 운영 환경
└── backend/
    ├── .env.local          # 백엔드 로컬 환경
    └── .env.production     # 백엔드 운영 환경
```

### 환경별 주소 설정
| 환경 | 프론트엔드 | 백엔드 API |
|------|-----------|-----------|
| 로컬 | localhost:8081 | localhost:3030 |
| 운영 | toughdev.cafe24.com | toughdev.cafe24.com:3030 |

---

## 💻 로컬 개발 환경

### 1. 백엔드 서버 실행

```bash
# backend 디렉토리로 이동
cd backend

# 로컬 환경으로 실행
npm run dev:local

# 또는 직접 환경 파일 복사 후 실행
cp .env.local .env
npm run dev
```

### 2. 프론트엔드 앱 실행

```bash
# 프로젝트 루트에서 실행

# 로컬 환경으로 실행
npm run start:local

# Android 개발 (로컬)
npm run android:local

# iOS 개발 (로컬)
npm run ios:local
```

---

## 🚀 운영 서버 배포

### 1. 백엔드 배포 (toughdev.cafe24.com)

#### SSH로 서버 접속
```bash
ssh your_username@toughdev.cafe24.com
```

#### 서버에서 배포
```bash
# 프로젝트 디렉토리로 이동
cd /path/to/fieldlog/backend

# 최신 코드 가져오기
git pull origin main

# 의존성 설치
npm install --production

# 기존 프로세스 종료
pm2 stop fieldlog-backend

# 운영 환경으로 서버 시작 (자동으로 .env.production 복사됨)
npm run start:production

# 또는 PM2로 관리
pm2 start server.js --name fieldlog-backend
pm2 save
```

### 2. 프론트엔드 빌드 및 배포

#### Android APK 빌드 (운영)
```bash
# Android 빌드 (자동으로 .env.production 복사됨)
npm run android:production

# 또는 EAS Build 사용
eas build --platform android --profile production
```

#### iOS 빌드 (운영)
```bash
# iOS 빌드 (자동으로 .env.production 복사됨)
npm run ios:production

# 또는 EAS Build 사용
eas build --platform ios --profile production
```

---

## 🔐 환경 변수 관리

### 백엔드 환경 변수

#### `.env.local` (로컬 개발)
```env
NODE_ENV=development
PORT=3030
DB_HOST=localhost
CORS_ORIGIN=http://localhost:8081
JWT_SECRET=your_local_secret
```

#### `.env.production` (운영)
```env
NODE_ENV=production
PORT=3030
DB_HOST=toughdev.cafe24.com
CORS_ORIGIN=https://toughdev.cafe24.com
JWT_SECRET=your_strong_production_secret
```

### 프론트엔드 환경 변수

#### `.env.local` (로컬)
```env
EXPO_PUBLIC_API_HOST=localhost
EXPO_PUBLIC_API_PORT=3030
EXPO_PUBLIC_ENV=local
```

#### `.env.production` (운영)
```env
EXPO_PUBLIC_API_HOST=toughdev.cafe24.com
EXPO_PUBLIC_API_PORT=3030
EXPO_PUBLIC_ENV=production
```

### 🔒 보안 주의사항

1. **절대 커밋하지 말 것:**
   - `.env`
   - `.env.local`
   - `backend/.env`
   - `backend/.env.local`

2. **운영 환경 비밀키:**
   - JWT_SECRET은 최소 32자 이상의 강력한 랜덤 문자열 사용
   - 데이터베이스 비밀번호는 강력하게 설정
   - MinIO 키는 운영용으로 별도 생성

3. **환경 변수 생성 예시:**
```bash
# 강력한 JWT Secret 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ✅ 배포 체크리스트

### 배포 전 확인사항

- [ ] `.env.production` 파일의 모든 설정 확인
- [ ] 데이터베이스 백업 완료
- [ ] JWT_SECRET이 강력한 키로 설정되었는지 확인
- [ ] CORS_ORIGIN이 운영 도메인으로 설정되었는지 확인
- [ ] 데이터베이스 마이그레이션 필요 여부 확인
- [ ] API 엔드포인트 테스트 완료

### 백엔드 배포 체크리스트

- [ ] 최신 코드 pull 완료
- [ ] `npm install --production` 실행
- [ ] `.env.production` 파일 적용
- [ ] 데이터베이스 연결 테스트
- [ ] 서버 재시작 (PM2 또는 systemd)
- [ ] 헬스체크 확인: `curl http://toughdev.cafe24.com:3030/api/health`
- [ ] 로그 확인하여 에러 없는지 체크

### 프론트엔드 배포 체크리스트

- [ ] `.env.production` 파일 적용
- [ ] API 호스트가 운영 서버로 설정되었는지 확인
- [ ] 빌드 성공 확인
- [ ] APK/IPA 파일 생성 확인
- [ ] 테스트 디바이스에서 설치 및 동작 확인
- [ ] API 통신 정상 작동 확인

---

## 🛠️ 트러블슈팅

### 1. API 연결 실패

**증상:** 앱에서 "네트워크 오류" 발생

**해결방법:**
```bash
# 백엔드 서버 상태 확인
curl http://toughdev.cafe24.com:3030/api/health

# 방화벽 설정 확인 (포트 3030 오픈 여부)
# CORS 설정 확인 (백엔드 .env의 CORS_ORIGIN)
```

### 2. 환경 변수가 적용되지 않음

**해결방법:**
```bash
# 프론트엔드
rm -rf node_modules/.cache
node scripts/copy-env.js production
npm start

# 백엔드
cd backend
node scripts/copy-env.js production
pm2 restart fieldlog-backend
```

### 3. 데이터베이스 연결 실패

**해결방법:**
```bash
# PostgreSQL 서비스 상태 확인
sudo systemctl status postgresql

# 데이터베이스 접속 테스트
psql -h toughdev.cafe24.com -U fieldlog_user -d fieldlog_prod
```

---

## 📞 자동화 스크립트 (선택사항)

### 배포 자동화 스크립트 생성

`deploy.sh` 파일 생성:
```bash
#!/bin/bash

echo "🚀 FieldLog 백엔드 배포 시작..."

# 최신 코드 가져오기
git pull origin main

# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install --production

# PM2로 재시작 (자동으로 .env.production 복사됨)
npm run start:production
# 또는
pm2 restart fieldlog-backend

echo "✅ 배포 완료!"
echo "📊 로그 확인: pm2 logs fieldlog-backend"
```

실행:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔄 업데이트 프로세스

### 일반적인 업데이트 흐름

1. **로컬에서 개발 및 테스트**
   ```bash
   npm run dev:local  # 백엔드
   npm run start:local  # 프론트엔드
   ```

2. **코드 커밋 및 푸시**
   ```bash
   git add .
   git commit -m "feat: 새로운 기능 추가"
   git push origin main
   ```

3. **운영 서버에 배포**
   ```bash
   ssh your_username@toughdev.cafe24.com
   cd /path/to/fieldlog
   ./deploy.sh
   ```

4. **배포 확인**
   - Health check: `curl http://toughdev.cafe24.com:3030/api/health`
   - PM2 상태: `pm2 status`
   - 로그 확인: `pm2 logs fieldlog-backend`

---

## 📚 참고 자료

- [Express.js 배포 가이드](https://expressjs.com/ko/advanced/best-practice-performance.html)
- [Expo 배포 가이드](https://docs.expo.dev/distribution/introduction/)
- [PM2 문서](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Node.js 환경변수 관리](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs)

---

## 💡 추가 권장사항

1. **모니터링 설정**
   - PM2 Plus를 사용한 서버 모니터링
   - Sentry를 통한 에러 추적

2. **백업 전략**
   - 매일 자동 데이터베이스 백업
   - 주요 파일 백업 스케줄 설정

3. **CI/CD 구축**
   - GitHub Actions를 통한 자동 배포
   - 테스트 자동화

4. **SSL 인증서**
   - Let's Encrypt를 통한 HTTPS 설정
   - 자동 갱신 설정

