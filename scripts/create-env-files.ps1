# PowerShell 스크립트 - 환경 파일 생성
# 사용법: .\scripts\create-env-files.ps1

Write-Host "🚀 FieldLog 환경 파일 생성 스크립트" -ForegroundColor Cyan
Write-Host ""

# 백엔드 로컬 환경
Write-Host "📝 backend/.env.local 생성 중..." -ForegroundColor Yellow
@"
# 로컬 개발 환경 설정
NODE_ENV=development

# 서버 설정
PORT=3030

# 데이터베이스 설정 (로컬)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=app
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
"@ | Out-File -FilePath backend\.env.local -Encoding UTF8 -NoNewline
Write-Host "✅ backend/.env.local 생성 완료" -ForegroundColor Green

# 백엔드 운영 환경
Write-Host "📝 backend/.env.production 생성 중..." -ForegroundColor Yellow
@"
# 운영 환경 설정
NODE_ENV=production

# 서버 설정
PORT=3030

# 데이터베이스 설정 (운영)
DB_HOST=toughdev.cafe24.com
DB_PORT=5432
DB_NAME=app_prod
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
"@ | Out-File -FilePath backend\.env.production -Encoding UTF8 -NoNewline
Write-Host "✅ backend/.env.production 생성 완료" -ForegroundColor Green

# 프론트엔드 로컬 환경
Write-Host "📝 .env.local 생성 중..." -ForegroundColor Yellow
@"
# 프론트엔드 로컬 개발 환경 설정
# Expo는 EXPO_PUBLIC_ 접두사가 붙은 환경변수만 사용할 수 있습니다

# API 서버 설정 (로컬)
EXPO_PUBLIC_API_HOST=localhost
EXPO_PUBLIC_API_PORT=3030

# 환경 구분
EXPO_PUBLIC_ENV=local
"@ | Out-File -FilePath .env.local -Encoding UTF8 -NoNewline
Write-Host "✅ .env.local 생성 완료" -ForegroundColor Green

# 프론트엔드 운영 환경
Write-Host "📝 .env.production 생성 중..." -ForegroundColor Yellow
@"
# 프론트엔드 운영 환경 설정
# Expo는 EXPO_PUBLIC_ 접두사가 붙은 환경변수만 사용할 수 있습니다

# API 서버 설정 (운영)
EXPO_PUBLIC_API_HOST=toughdev.cafe24.com
EXPO_PUBLIC_API_PORT=3030

# 환경 구분
EXPO_PUBLIC_ENV=production
"@ | Out-File -FilePath .env.production -Encoding UTF8 -NoNewline
Write-Host "✅ .env.production 생성 완료" -ForegroundColor Green

Write-Host ""
Write-Host "Success! All environment files have been created!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Change production passwords and JWT secrets!" -ForegroundColor Red
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit backend/.env.production"
Write-Host "  2. Generate JWT Secret: node -e ""console.log(require('crypto').randomBytes(64).toString('hex'))"""
Write-Host "  3. See ENVIRONMENT_SETUP.md for details"
Write-Host ""

