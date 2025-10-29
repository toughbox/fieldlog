# 세션 관리 가이드

## 개요

이 문서는 FieldLog 앱의 세션 관리 시스템에 대한 설명입니다. 사용자가 로그인/로그아웃할 때 `user_session` 테이블이 어떻게 관리되는지 설명합니다.

## 구현된 기능

### 1. 로그인 시 세션 관리

**동작 방식:**
- 사용자가 로그인하면 새로운 세션이 생성됩니다
- **같은 기기(UserAgent)의 이전 세션은 자동으로 비활성화됩니다** (`is_active = false`)
- 새로운 세션 정보가 `user_session` 테이블에 저장됩니다

**코드 위치:** `backend/routes/auth.js` (274-293줄)

```javascript
// 같은 기기의 이전 세션 무효화
await query(
  `UPDATE fieldlog.user_session 
   SET is_active = false 
   WHERE user_id = $1 AND device_info->>'userAgent' = $2 AND is_active = true`,
  [user.id, userAgent]
);

// 새 세션 저장
await query(
  `INSERT INTO fieldlog.user_session (...)
   VALUES (...)`,
  [...]
);
```

### 2. 로그아웃 시 세션 비활성화

**동작 방식:**
- 사용자가 로그아웃하면 해당 세션이 삭제되지 않고 **비활성화**됩니다 (`is_active = false`)
- 세션 이력이 보존되어 보안 감사 및 디버깅에 활용 가능합니다
- `last_used_at` 시간이 업데이트됩니다

**API 엔드포인트:** `POST /api/auth/logout`

**요청 본문:**
```json
{
  "refresh_token": "your_refresh_token_here"
}
```

**응답:**
```json
{
  "success": true,
  "message": "로그아웃 되었습니다."
}
```

**코드 위치:** 
- Backend: `backend/routes/auth.js` (589-628줄)
- Frontend: `src/context/AuthContext.tsx` (138-188줄)

### 3. 토큰 갱신 (Refresh Token)

**동작 방식:**
- `access_token`이 만료되면 `refresh_token`으로 새로운 `access_token`을 발급받습니다
- 세션이 활성 상태(`is_active = true`)이고 만료되지 않았는지 확인합니다
- `last_used_at` 시간이 업데이트됩니다

**API 엔드포인트:** `POST /api/auth/refresh-token`

**요청 본문:**
```json
{
  "refresh_token": "your_refresh_token_here"
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
      "phone": "010-1234-5678"
    },
    "access_token": "new_access_token",
    "refresh_token": "same_refresh_token"
  },
  "message": "토큰이 갱신되었습니다."
}
```

**코드 위치:** `backend/routes/auth.js` (630-740줄)

### 4. 세션 목록 조회

**동작 방식:**
- 현재 사용자의 모든 활성 세션 목록을 조회합니다
- 기기 정보, IP 주소, 마지막 사용 시간 등을 확인할 수 있습니다

**API 엔드포인트:** `GET /api/auth/sessions`

**헤더:**
```
Authorization: Bearer {access_token}
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "device_info": {
        "userAgent": "Mozilla/5.0 ..."
      },
      "ip_address": "192.168.1.100",
      "created_at": "2025-01-15T10:30:00Z",
      "last_used_at": "2025-01-15T14:20:00Z",
      "expires_at": "2025-01-22T10:30:00Z"
    }
  ]
}
```

**코드 위치:** `backend/routes/auth.js` (742-784줄)

### 5. 특정 세션 로그아웃 (다른 기기에서 로그아웃)

**동작 방식:**
- 사용자가 다른 기기의 세션을 강제로 로그아웃시킬 수 있습니다
- "내 계정 보안" 기능 구현에 유용합니다

**API 엔드포인트:** `POST /api/auth/logout-session`

**헤더:**
```
Authorization: Bearer {access_token}
```

**요청 본문:**
```json
{
  "session_id": 123
}
```

**응답:**
```json
{
  "success": true,
  "message": "세션이 로그아웃되었습니다."
}
```

**코드 위치:** `backend/routes/auth.js` (786-845줄)

## 자동 세션 정리

### 1. 만료된 활성 세션 비활성화

**동작 방식:**
- 1시간마다 실행됩니다
- `expires_at`이 지난 활성 세션을 비활성화합니다

**코드 위치:** `backend/routes/auth.js` (885-902줄)

```javascript
setInterval(async () => {
  const result = await query(
    `UPDATE fieldlog.user_session 
     SET is_active = false 
     WHERE is_active = true 
       AND expires_at < NOW()
     RETURNING id`
  );
  
  if (result.rows.length > 0) {
    console.log(`✅ ${result.rows.length}개의 만료된 세션 비활성화 완료`);
  }
}, 60 * 60 * 1000); // 1시간마다 실행
```

### 2. 오래된 비활성 세션 삭제

**동작 방식:**
- 24시간마다 실행됩니다
- 30일 이상 된 비활성 세션(`is_active = false`)을 완전히 삭제합니다
- 데이터베이스 크기를 관리하고 성능을 유지합니다

**코드 위치:** `backend/routes/auth.js` (866-883줄)

```javascript
setInterval(async () => {
  const result = await query(
    `DELETE FROM fieldlog.user_session 
     WHERE is_active = false 
       AND last_used_at < NOW() - INTERVAL '30 days'
     RETURNING id`
  );
  
  if (result.rows.length > 0) {
    console.log(`✅ ${result.rows.length}개의 오래된 비활성 세션 정리 완료`);
  }
}, 24 * 60 * 60 * 1000); // 24시간마다 실행
```

## 데이터베이스 스키마

```sql
CREATE TABLE fieldlog.user_session (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES fieldlog.user(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    device_info JSONB,
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_session_user_id ON fieldlog.user_session (user_id);
CREATE INDEX idx_user_session_refresh_token ON fieldlog.user_session (refresh_token);
CREATE INDEX idx_user_session_expires_at ON fieldlog.user_session (expires_at);
CREATE INDEX idx_user_session_active ON fieldlog.user_session (is_active);
```

## 프론트엔드 통합

### API 서비스 (`src/services/api.ts`)

```typescript
// 로그아웃
authApi.logout(refreshToken);

// 토큰 갱신
authApi.refreshToken(refreshToken);

// 세션 목록 조회
authApi.getSessions(accessToken);

// 특정 세션 로그아웃
authApi.logoutSession(accessToken, sessionId);
```

### AuthContext 통합 (`src/context/AuthContext.tsx`)

로그아웃 시 자동으로 서버 API를 호출하여 세션을 비활성화합니다:

```typescript
const logout = async () => {
  // 1. 서버에 로그아웃 요청 (세션 비활성화)
  const refreshToken = await TokenService.getRefreshToken();
  if (refreshToken) {
    await authApi.logout(refreshToken);
  }
  
  // 2. 로컬 알림 취소
  await NotificationService.cancelAllScheduledNotifications();
  
  // 3. FCM 토큰 제거
  const fcmToken = await NotificationService.getFCMToken();
  if (fcmToken) {
    await currentNotificationApi.unregisterToken(fcmToken);
  }
  
  // 4. 로컬 인증 정보 삭제
  await TokenService.clearAuthData();
  
  // 5. 상태 초기화
  setIsAuthenticated(false);
  setUser(null);
};
```

## 보안 고려사항

### 장점

1. **세션 이력 보존**: 보안 감사 및 의심스러운 활동 추적 가능
2. **기기별 세션 관리**: 사용자가 어느 기기에서 로그인했는지 확인 가능
3. **강제 로그아웃**: 다른 기기에서 로그아웃 기능 구현 가능
4. **디버깅 용이**: 문제 발생 시 세션 이력 확인 가능

### 보안 권장사항

1. **HTTPS 사용**: 프로덕션 환경에서는 반드시 HTTPS를 사용하세요
2. **토큰 만료 시간 설정**: 
   - Access Token: 24시간 (환경변수 `JWT_EXPIRES_IN`)
   - Refresh Token: 7일 (환경변수 `JWT_REFRESH_EXPIRES_IN`)
3. **세션 제한**: 사용자당 최대 활성 세션 수 제한 권장 (예: 5개)
4. **IP 주소 모니터링**: 이상한 IP에서 로그인 시 알림

## 테스트 방법

### 1. 로그인 테스트

```bash
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. 로그아웃 테스트

```bash
curl -X POST http://localhost:3030/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token"
  }'
```

### 3. 토큰 갱신 테스트

```bash
curl -X POST http://localhost:3030/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token"
  }'
```

### 4. 세션 목록 조회 테스트

```bash
curl -X GET http://localhost:3030/api/auth/sessions \
  -H "Authorization: Bearer your_access_token"
```

### 5. 데이터베이스 확인

```sql
-- 활성 세션 조회
SELECT * FROM fieldlog.user_session WHERE is_active = true;

-- 비활성 세션 조회
SELECT * FROM fieldlog.user_session WHERE is_active = false;

-- 사용자별 세션 수 확인
SELECT user_id, 
       COUNT(*) as total_sessions,
       COUNT(*) FILTER (WHERE is_active = true) as active_sessions
FROM fieldlog.user_session
GROUP BY user_id;
```

## 문제 해결

### 문제: 세션이 계속 누적됨

**원인:** 로그아웃 API가 호출되지 않음

**해결방법:**
1. 프론트엔드에서 로그아웃 시 `authApi.logout(refreshToken)` 호출 확인
2. 네트워크 요청이 실패하는지 확인
3. 서버 로그 확인

### 문제: 토큰이 만료되었다고 나옴

**원인:** `expires_at`이 지남

**해결방법:**
1. `authApi.refreshToken()`을 사용하여 토큰 갱신
2. 만료 시간이 너무 짧은지 확인 (환경변수)
3. 자동 토큰 갱신 로직 구현 권장

## 추가 개선 사항 (선택사항)

### 1. 자동 토큰 갱신

Access Token이 만료되기 전에 자동으로 갱신하는 로직 추가:

```typescript
// src/services/tokenService.ts
const AUTO_REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5분 전

export const setupAutoRefresh = async () => {
  const expiryTime = await getAccessTokenExpiry();
  const now = Date.now();
  const timeUntilRefresh = expiryTime - now - AUTO_REFRESH_BEFORE_EXPIRY;
  
  if (timeUntilRefresh > 0) {
    setTimeout(async () => {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        const response = await authApi.refreshToken(refreshToken);
        if (response.success) {
          await saveAuthData(
            response.data.access_token,
            response.data.refresh_token,
            response.data.user
          );
        }
      }
    }, timeUntilRefresh);
  }
};
```

### 2. 세션 제한

사용자당 최대 활성 세션 수 제한:

```javascript
// 로그인 API에서 추가
const MAX_SESSIONS_PER_USER = 5;

const activeSessions = await query(
  'SELECT COUNT(*) FROM fieldlog.user_session WHERE user_id = $1 AND is_active = true',
  [user.id]
);

if (activeSessions.rows[0].count >= MAX_SESSIONS_PER_USER) {
  // 가장 오래된 세션 비활성화
  await query(
    `UPDATE fieldlog.user_session 
     SET is_active = false 
     WHERE id IN (
       SELECT id FROM fieldlog.user_session 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY last_used_at ASC 
       LIMIT 1
     )`,
    [user.id]
  );
}
```

## 참고 자료

- JWT 토큰 관리: https://jwt.io/
- PostgreSQL JSONB: https://www.postgresql.org/docs/current/datatype-json.html
- Express.js 보안: https://expressjs.com/en/advanced/best-practice-security.html

## 변경 이력

- 2025-10-29: 초기 문서 작성, 혼합 접근 방식 구현 완료

