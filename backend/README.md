# FieldLog 백엔드 API

현장기록(FieldLog) 앱의 백엔드 API 서버입니다.

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
```bash
cp env.example .env
# .env 파일을 편집하여 데이터베이스 정보 등을 입력하세요
```

### 3. 데이터베이스 설정
- PostgreSQL이 설치되어 있어야 합니다
- `database_schema.sql` 파일을 사용하여 데이터베이스 스키마를 생성하세요

```bash
# PostgreSQL에 연결하여 스키마 실행
psql -U postgres -d fieldlog -f ../database_schema.sql
```

### 4. 서버 실행
```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

## 📡 API 엔드포인트

### 인증 (Authentication)

#### POST `/api/auth/signup`
새 사용자 회원가입

**요청 본문:**
```json
{
  "name": "홍길동",
  "email": "user@example.com",
  "password": "password123",
  "phone": "010-1234-5678",
  "company": "테스트 회사"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "홍길동",
    "email": "user@example.com",
    "phone": "010-1234-5678",
    "company": "테스트 회사",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "회원가입이 완료되었습니다."
}
```

#### POST `/api/auth/login`
사용자 로그인

**요청 본문:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "홍길동",
      "email": "user@example.com",
      "phone": "010-1234-5678",
      "company": "테스트 회사"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "message": "로그인 성공"
}
```

#### GET `/api/auth/check-email?email=user@example.com`
이메일 중복 확인

**응답:**
```json
{
  "success": true,
  "data": {
    "available": true
  },
  "message": "사용 가능한 이메일입니다."
}
```

### 헬스체크

#### GET `/api/health`
서버 상태 확인

**응답:**
```json
{
  "status": "OK",
  "message": "FieldLog API 서버가 정상 작동 중입니다.",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## 🛡️ 보안 기능

- **Helmet**: HTTP 헤더 보안
- **CORS**: Cross-Origin Resource Sharing 설정
- **Rate Limiting**: API 요청 횟수 제한
- **bcryptjs**: 비밀번호 해싱 (Salt Rounds: 12)
- **JWT**: JSON Web Token 인증
- **Input Validation**: 입력값 검증

## 🗄️ 데이터베이스 스키마

프로젝트 루트의 `database_schema.sql` 파일을 참조하세요.

주요 테이블:
- `fieldlog.user`: 사용자 정보
- `fieldlog.user_session`: 사용자 세션 관리
- `fieldlog.category`: 카테고리 관리
- `fieldlog.field_record`: 현장 기록 데이터

## 🔧 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PORT` | 서버 포트 | 3000 |
| `NODE_ENV` | 실행 환경 | development |
| `DB_HOST` | 데이터베이스 호스트 | localhost |
| `DB_PORT` | 데이터베이스 포트 | 5432 |
| `DB_NAME` | 데이터베이스 이름 | fieldlog |
| `DB_USER` | 데이터베이스 사용자 | postgres |
| `DB_PASSWORD` | 데이터베이스 비밀번호 | - |
| `JWT_SECRET` | JWT 비밀키 | - |
| `JWT_REFRESH_SECRET` | JWT 리프레시 비밀키 | - |
| `CORS_ORIGIN` | CORS 허용 도메인 | http://localhost:8081 |

## 📝 로그

서버는 다음과 같은 정보를 콘솔에 출력합니다:
- API 요청 로그
- 데이터베이스 쿼리 성능
- 인증 성공/실패
- 오류 상황

## 🚨 에러 처리

모든 API 응답은 다음 형식을 따릅니다:

**성공 응답:**
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## 🧪 테스트 계정

개발 환경에서 사용할 수 있는 테스트 계정:
- **이메일**: test@fieldlog.com
- **비밀번호**: password123

## 📦 의존성

주요 패키지:
- `express`: 웹 프레임워크
- `pg`: PostgreSQL 클라이언트
- `bcryptjs`: 비밀번호 해싱
- `jsonwebtoken`: JWT 토큰 관리
- `cors`: CORS 설정
- `helmet`: 보안 헤더
- `express-rate-limit`: 요청 제한
