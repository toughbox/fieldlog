# 🏗️ FieldLog - 현장 기록 관리 시스템

현장에서 발생하는 다양한 업무를 체계적으로 기록하고 관리하는 React Native 모바일 애플리케이션입니다.

## 📱 스크린샷

<img width="528" height="1032" alt="스크린샷 2025-09-24 180014" src="https://github.com/user-attachments/assets/7910d2f4-a57d-4b08-8fc2-ec06da3d3ff3" />

<img width="528" height="1032" alt="스크린샷 2025-09-24 180037" src="https://github.com/user-attachments/assets/6801d31d-7a6b-4fb5-913f-b2dc36690886" />

<img width="528" height="1032" alt="스크린샷 2025-09-24 180046" src="https://github.com/user-attachments/assets/30664084-f796-4bbe-abaf-ceccd6cf294c" />

<img width="528" height="1032" alt="스크린샷 2025-09-24 180055" src="https://github.com/user-attachments/assets/abec2c0c-ea6a-4701-b454-d4d89a04507e" />

<img width="528" height="1032" alt="스크린샷 2025-09-24 180108" src="https://github.com/user-attachments/assets/b96c5fe7-599e-49d0-a413-80663fa18604" />

<img width="528" height="1032" alt="스크린샷 2025-09-24 180121" src="https://github.com/user-attachments/assets/071ce1bf-4bda-4a5b-9ca7-aa95b0ffbe0d" />

<img width="528" height="1032" alt="스크린샷 2025-09-24 180127" src="https://github.com/user-attachments/assets/32a5bf3e-83a2-4741-9b27-e1a09c61c549" />

<img width="528" height="1032" alt="스크린샷 2025-09-24 180200" src="https://github.com/user-attachments/assets/fd7b7b38-d71e-433b-8501-0bfcbe5abc60" />

<img width="528" height="1032" alt="스크린샷 2025-09-24 180146" src="https://github.com/user-attachments/assets/60fc335f-13f9-4854-9c52-c8ac2dfa3bc4" />

---

## 🚀 빠른 시작

### 1️⃣ 환경 파일 설정

**반드시 먼저 환경 파일을 생성해야 합니다!**

#### PowerShell (Windows)
```powershell
.\scripts\create-env-files.ps1
```

#### Bash (Linux/Mac)
```bash
chmod +x scripts/create-env-files.sh
./scripts/create-env-files.sh
```

자세한 내용은 [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)를 참고하세요.

### 2️⃣ 의존성 설치

```bash
# 프론트엔드 의존성
npm install

# 백엔드 의존성
cd backend
npm install
```

### 3️⃣ 개발 서버 실행

#### 로컬 개발 환경

```bash
# 백엔드 서버 (터미널 1)
cd backend
npm run dev:local

# 프론트엔드 앱 (터미널 2)
npm run start:local
```

#### 운영 환경 테스트

```bash
# 백엔드
cd backend
npm run start:production

# 프론트엔드
npm run start:production
```

---

## 📂 프로젝트 구조

```
fieldlog/
├── src/                      # 프론트엔드 소스
│   ├── components/           # 재사용 가능한 컴포넌트
│   ├── screens/              # 화면 컴포넌트
│   ├── services/             # API 서비스
│   ├── context/              # Context API
│   └── utils/                # 유틸리티 함수
├── backend/                  # 백엔드 서버
│   ├── routes/               # API 라우트
│   ├── config/               # 설정 파일
│   ├── .env.local           # 로컬 환경 설정
│   └── .env.production      # 운영 환경 설정
├── scripts/                  # 유틸리티 스크립트
├── .env.local               # 프론트엔드 로컬 환경
├── .env.production          # 프론트엔드 운영 환경
├── ENVIRONMENT_SETUP.md     # 환경 설정 가이드
└── DEPLOYMENT_GUIDE.md      # 배포 가이드
```

---

## 🔧 주요 기능

- ✅ 사용자 인증 (회원가입/로그인)
- ✅ 현장 관리 (생성/수정/삭제)
- ✅ 현장 기록 작성 및 관리
- ✅ 이미지 첨부 기능
- ✅ 커스텀 필드 스키마
- ✅ 상태별 기록 필터링
- ✅ 우선순위 관리
- ✅ 통계 및 대시보드

---

## 🌐 환경별 설정

### 로컬 개발 환경
- **프론트엔드**: localhost:8081
- **백엔드 API**: localhost:3030
- **데이터베이스**: 로컬 PostgreSQL/SQLite

### 운영 환경
- **도메인**: toughdev.cafe24.com
- **백엔드 API**: toughdev.cafe24.com:3030
- **데이터베이스**: 운영 PostgreSQL

자세한 환경 설정은 [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)를 참고하세요.

---

## 📦 배포

배포 프로세스에 대한 자세한 내용은 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)를 참고하세요.

### 간단 배포 요약

```bash
# 1. 서버 접속
ssh your_username@toughdev.cafe24.com

# 2. 코드 업데이트
cd /path/to/fieldlog
git pull origin main

# 3. 백엔드 배포
cd backend
npm install --production
npm run start:production

# 4. PM2로 관리 (권장)
pm2 restart fieldlog-backend
```

---

## 🛠️ 기술 스택

### 프론트엔드
- React Native (Expo)
- TypeScript
- React Navigation
- Gluestack UI

### 백엔드
- Node.js
- Express.js
- PostgreSQL / SQLite
- JWT 인증
- MinIO (파일 저장소)

---

## 📝 NPM 스크립트

### 프론트엔드
```bash
npm run start:local          # 로컬 환경으로 시작
npm run start:production     # 운영 환경으로 시작
npm run android:local        # 로컬 Android 빌드
npm run android:production   # 운영 Android 빌드
npm run ios:local           # 로컬 iOS 빌드
npm run ios:production      # 운영 iOS 빌드
```

### 백엔드
```bash
npm run dev:local           # 로컬 개발 모드 (nodemon)
npm run start:production    # 운영 모드
npm run init-db            # 데이터베이스 초기화
```

---

## 🔐 보안

- 환경 파일(`.env*`)은 절대 Git에 커밋하지 마세요
- JWT Secret은 강력한 랜덤 문자열을 사용하세요
- 운영 환경 비밀번호는 별도로 안전하게 관리하세요

---

## 📚 추가 문서

- [환경 설정 가이드](./ENVIRONMENT_SETUP.md)
- [배포 가이드](./DEPLOYMENT_GUIDE.md)
- [프로젝트 규칙](./PROJECT_RULES.md)
- [변경 이력](./CHANGELOG.md)

---

## 🤝 기여

프로젝트에 기여하고 싶으시다면:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.




