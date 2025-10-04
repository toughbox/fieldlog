#!/bin/bash
# Bash 스크립트 - 환경 파일 생성
# 사용법: ./scripts/create-env-files.sh

echo "🚀 FieldLog 환경 파일 생성 스크립트"
echo ""

# 백엔드 로컬 환경
echo "📝 backend/.env.local 생성 중..."
cat > backend/.env.local << 'EOF'
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
EOF
echo "✅ backend/.env.local 생성 완료"

# 백엔드 운영 환경
echo "📝 backend/.env.production 생성 중..."
cat > backend/.env.production << 'EOF'
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
EOF
echo "✅ backend/.env.production 생성 완료"

# 프론트엔드 로컬 환경
echo "📝 .env.local 생성 중..."
cat > .env.local << 'EOF'
# 프론트엔드 로컬 개발 환경 설정
# Expo는 EXPO_PUBLIC_ 접두사가 붙은 환경변수만 사용할 수 있습니다

# API 서버 설정 (로컬)
EXPO_PUBLIC_API_HOST=localhost
EXPO_PUBLIC_API_PORT=3030

# 환경 구분
EXPO_PUBLIC_ENV=local
EOF
echo "✅ .env.local 생성 완료"

# 프론트엔드 운영 환경
echo "📝 .env.production 생성 중..."
cat > .env.production << 'EOF'
# 프론트엔드 운영 환경 설정
# Expo는 EXPO_PUBLIC_ 접두사가 붙은 환경변수만 사용할 수 있습니다

# API 서버 설정 (운영)
EXPO_PUBLIC_API_HOST=toughdev.cafe24.com
EXPO_PUBLIC_API_PORT=3030

# 환경 구분
EXPO_PUBLIC_ENV=production
EOF
echo "✅ .env.production 생성 완료"

echo ""
echo "🎉 모든 환경 파일이 성공적으로 생성되었습니다!"
echo ""
echo "⚠️  중요: 운영 환경의 비밀번호와 JWT Secret을 반드시 변경하세요!"
echo ""
echo "📚 다음 단계:"
echo "  1. backend/.env.production 파일의 비밀번호 및 키 변경"
echo "  2. JWT Secret 생성: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
echo "  3. ENVIRONMENT_SETUP.md 문서 참고"
echo ""

