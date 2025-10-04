# 환경 설정 파일 생성 가이드

## 📝 환경 파일 생성 방법

다음 파일들을 **직접 생성**해야 합니다. (보안상 Git에서 제외됨)

---

## 1️⃣ 백엔드 로컬 환경 설정

**파일:** `backend/.env.local`

```env
# 로컬 개발 환경 설정
NODE_ENV=development

# 서버 설정
PORT=3030

# 데이터베이스 설정 (로컬)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fieldlog
DB_USER=postgres
DB_PASSWORD=your_local_password

# JWT 설정
JWT_SECRET=your_super_secret_jwt_key_here_local
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_local
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS 설정 (로컬 개발)
CORS_ORIGIN=http://localhost:8081

# MinIO 설정 (로컬)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=fieldlog-dev
```

---

## 2️⃣ 백엔드 운영 환경 설정

**파일:** `backend/.env.production`

```env
# 운영 환경 설정
NODE_ENV=production

# 서버 설정
PORT=3030

# 데이터베이스 설정 (운영)
DB_HOST=toughdev.cafe24.com
DB_PORT=5432
DB_NAME=fieldlog_prod
DB_USER=fieldlog_user
DB_PASSWORD=your_production_password_here

# JWT 설정 (운영 - 반드시 강력한 키로 변경하세요!)
JWT_SECRET=your_production_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_production_super_secret_refresh_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS 설정 (운영)
CORS_ORIGIN=https://toughdev.cafe24.com

# MinIO 설정 (운영)
MINIO_ENDPOINT=toughdev.cafe24.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_production_minio_key
MINIO_SECRET_KEY=your_production_minio_secret
MINIO_BUCKET_NAME=fieldlog-prod
```

---

## 3️⃣ 프론트엔드 로컬 환경 설정

**파일:** `.env.local` (프로젝트 루트)

```env
# 프론트엔드 로컬 개발 환경 설정
# Expo는 EXPO_PUBLIC_ 접두사가 붙은 환경변수만 사용할 수 있습니다

# API 서버 설정 (로컬)
EXPO_PUBLIC_API_HOST=localhost
EXPO_PUBLIC_API_PORT=3030

# 환경 구분
EXPO_PUBLIC_ENV=local
```

---

## 4️⃣ 프론트엔드 운영 환경 설정

**파일:** `.env.production` (프로젝트 루트)

```env
# 프론트엔드 운영 환경 설정
# Expo는 EXPO_PUBLIC_ 접두사가 붙은 환경변수만 사용할 수 있습니다

# API 서버 설정 (운영)
EXPO_PUBLIC_API_HOST=toughdev.cafe24.com
EXPO_PUBLIC_API_PORT=3030

# 환경 구분
EXPO_PUBLIC_ENV=production
```

---

## 🚀 빠른 시작

### PowerShell에서 파일 생성 (Windows)

```powershell
# 백엔드 로컬 환경
@"
NODE_ENV=development
PORT=3030
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fieldlog
DB_USER=postgres
DB_PASSWORD=your_local_password
JWT_SECRET=your_super_secret_jwt_key_here_local
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_local
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8081
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=fieldlog-dev
"@ | Out-File -FilePath backend\.env.local -Encoding UTF8

# 백엔드 운영 환경
@"
NODE_ENV=production
PORT=3030
DB_HOST=toughdev.cafe24.com
DB_PORT=5432
DB_NAME=fieldlog_prod
DB_USER=fieldlog_user
DB_PASSWORD=your_production_password_here
JWT_SECRET=your_production_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_production_super_secret_refresh_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://toughdev.cafe24.com
MINIO_ENDPOINT=toughdev.cafe24.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_production_minio_key
MINIO_SECRET_KEY=your_production_minio_secret
MINIO_BUCKET_NAME=fieldlog-prod
"@ | Out-File -FilePath backend\.env.production -Encoding UTF8

# 프론트엔드 로컬 환경
@"
EXPO_PUBLIC_API_HOST=localhost
EXPO_PUBLIC_API_PORT=3030
EXPO_PUBLIC_ENV=local
"@ | Out-File -FilePath .env.local -Encoding UTF8

# 프론트엔드 운영 환경
@"
EXPO_PUBLIC_API_HOST=toughdev.cafe24.com
EXPO_PUBLIC_API_PORT=3030
EXPO_PUBLIC_ENV=production
"@ | Out-File -FilePath .env.production -Encoding UTF8

Write-Host "✅ 모든 환경 파일이 생성되었습니다!"
```

### Bash에서 파일 생성 (Linux/Mac)

```bash
# 백엔드 로컬 환경
cat > backend/.env.local << 'EOF'
NODE_ENV=development
PORT=3030
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fieldlog
DB_USER=postgres
DB_PASSWORD=your_local_password
JWT_SECRET=your_super_secret_jwt_key_here_local
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_local
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:8081
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=fieldlog-dev
EOF

# 백엔드 운영 환경
cat > backend/.env.production << 'EOF'
NODE_ENV=production
PORT=3030
DB_HOST=toughdev.cafe24.com
DB_PORT=5432
DB_NAME=fieldlog_prod
DB_USER=fieldlog_user
DB_PASSWORD=your_production_password_here
JWT_SECRET=your_production_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_production_super_secret_refresh_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://toughdev.cafe24.com
MINIO_ENDPOINT=toughdev.cafe24.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your_production_minio_key
MINIO_SECRET_KEY=your_production_minio_secret
MINIO_BUCKET_NAME=fieldlog-prod
EOF

# 프론트엔드 로컬 환경
cat > .env.local << 'EOF'
EXPO_PUBLIC_API_HOST=localhost
EXPO_PUBLIC_API_PORT=3030
EXPO_PUBLIC_ENV=local
EOF

# 프론트엔드 운영 환경
cat > .env.production << 'EOF'
EXPO_PUBLIC_API_HOST=toughdev.cafe24.com
EXPO_PUBLIC_API_PORT=3030
EXPO_PUBLIC_ENV=production
EOF

echo "✅ 모든 환경 파일이 생성되었습니다!"
```

---

## 🔐 보안 주의사항

### 1. 강력한 JWT Secret 생성

```bash
# Node.js로 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

생성된 값을 `JWT_SECRET`과 `JWT_REFRESH_SECRET`에 사용하세요.

### 2. 운영 환경 비밀번호

- 데이터베이스 비밀번호는 최소 16자 이상
- 대소문자, 숫자, 특수문자 조합
- 절대 소스코드에 포함하지 말 것

### 3. 환경 파일 관리

- `.env.local`, `.env.production` 파일은 절대 Git에 커밋하지 말 것
- `.gitignore`에 이미 추가되어 있음
- 팀원과 공유 시 안전한 방법 사용 (1Password, Bitwarden 등)

---

## ✅ 설정 완료 후 테스트

### 백엔드 테스트
```bash
# 로컬 환경으로 실행
cd backend
npm run dev:local

# Health check
curl http://localhost:3030/api/health
```

### 프론트엔드 테스트
```bash
# 로컬 환경으로 실행
npm run start:local

# API 연결 확인 - 앱 실행 후 로그 확인
```

---

## 📚 다음 단계

환경 파일 생성 후:
1. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 배포 가이드 참고
2. 로컬에서 개발 시작
3. 운영 서버에 배포

