# 푸시 알림 시스템 구현 완료 ✅

FieldLog 앱에 **FCM + 로컬 알림 조합** 방식의 푸시 알림 시스템이 성공적으로 구현되었습니다.

## 📦 구현 내용

### 1. 프론트엔드 (React Native + Expo)

#### ✅ 설치된 패키지
```json
{
  "expo-notifications": "^0.28.x",
  "expo-device": "^6.x",
  "@react-native-firebase/app": "^latest",
  "@react-native-firebase/messaging": "^latest"
}
```

#### ✅ 구현된 파일
1. **`src/services/notificationService.ts`** - 푸시 알림 핵심 로직
   - FCM 토큰 관리
   - 로컬 알림 예약
   - 알림 권한 요청
   - 알림 채널 설정 (Android)
   - 일정 알림 자동 예약

2. **`src/context/AuthContext.tsx`** - 인증과 알림 통합
   - 로그인 시 FCM 토큰 서버 등록
   - 로그아웃 시 토큰 제거 및 로컬 알림 취소

3. **`App.tsx`** - 글로벌 알림 핸들러
   - 알림 수신 리스너
   - 알림 탭 이벤트 처리
   - FCM 메시지 리스너

4. **`src/screens/CreateRecordScreen.tsx`** - 일정 생성 시 알림 예약
5. **`src/screens/EditRecordScreen.tsx`** - 일정 수정 시 알림 재예약
6. **`src/services/api.ts`** - 알림 API 엔드포인트 추가

#### ✅ 설정 파일
- **`app.json`** - Firebase 플러그인 및 알림 채널 설정

---

### 2. 백엔드 (Node.js + Express)

#### ✅ 설치된 패키지
```json
{
  "firebase-admin": "^12.x",
  "node-cron": "^3.x"
}
```

#### ✅ 구현된 파일
1. **`backend/services/notificationService.js`** - FCM 알림 발송
   - Firebase Admin SDK 초기화
   - 토큰별 알림 발송
   - 사용자별/다중 사용자 알림
   - 유효하지 않은 토큰 자동 비활성화

2. **`backend/services/schedulerService.js`** - 일정 알림 스케줄러
   - 매일 오전 9시 자동 실행
   - 내일 만료되는 일정 확인
   - 자동 알림 발송

3. **`backend/routes/notifications.js`** - 알림 API
   - `POST /api/notifications/register-token` - 토큰 등록
   - `DELETE /api/notifications/unregister-token` - 토큰 제거
   - `GET /api/notifications/user-tokens/:userId` - 사용자 토큰 조회
   - `POST /api/notifications/test` - 테스트 알림 발송

4. **`backend/server.js`** - 서버 통합
   - Firebase 초기화
   - 스케줄러 시작
   - 알림 라우트 등록

---

### 3. 데이터베이스

#### ✅ 새로운 테이블
```sql
CREATE TABLE push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    device_token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL, -- 'ios' 또는 'android'
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_device_token UNIQUE (device_token)
);
```

- **마이그레이션 파일**: `backend/migrations/add_push_tokens_table.sql`

---

## 🎯 주요 기능

### 1️⃣ FCM 푸시 알림 (서버 → 앱)
- ✅ 실시간 알림 발송
- ✅ 포그라운드/백그라운드 모두 지원
- ✅ 알림 탭 시 화면 이동 (구현 가능)
- ✅ 커스텀 데이터 전달

### 2️⃣ 로컬 알림 (앱 자체)
- ✅ 일정 하루 전 자동 알림
  - 일정 시작 하루 전 (created_at 기준)
  - 일정 만료 하루 전 (due_date 기준)
- ✅ 특정 시간 예약 (기본: 오전 9시)
- ✅ 앱이 종료되어도 알림 발송

### 3️⃣ 일정 알림 스케줄러
- ✅ 매일 오전 9시 자동 실행
- ✅ 내일 만료되는 미완료 일정 확인
- ✅ FCM을 통해 자동 알림 발송
- ✅ 알림 로그 기록 (선택)

### 4️⃣ 토큰 관리
- ✅ 로그인 시 자동 등록
- ✅ 로그아웃 시 자동 제거
- ✅ 토큰 갱신 자동 처리
- ✅ 유효하지 않은 토큰 자동 비활성화

---

## 🔧 필요한 추가 작업 (사용자가 해야 할 일)

### ✅ Firebase 설정
다음 파일들을 Firebase Console에서 다운로드하여 추가해야 합니다:

#### 1. Android 설정
```
android/app/google-services.json
```
- Firebase Console → 프로젝트 설정 → Android 앱 추가
- 패키지 이름: `com.toughbox.fieldlog`

#### 2. iOS 설정
```
ios/GoogleService-Info.plist
```
- Firebase Console → 프로젝트 설정 → iOS 앱 추가
- 번들 ID: `com.toughbox.fieldlog`
- **중요**: APNs 인증서도 업로드 필요

#### 3. 백엔드 설정
```
backend/firebase-service-account.json
```
- Firebase Console → 프로젝트 설정 → 서비스 계정
- "새 비공개 키 생성" 클릭

자세한 설정 방법은 **`FCM_SETUP_GUIDE.md`** 파일을 참고하세요.

---

## 📝 API 사용 예시

### 1. 디바이스 토큰 등록
```typescript
import { currentNotificationApi } from './services/api';

const fcmToken = await NotificationService.getFCMToken();
await currentNotificationApi.registerToken(
  userId,
  fcmToken,
  Platform.OS as 'ios' | 'android',
  { model: Platform.OS, version: Platform.Version }
);
```

### 2. 로컬 알림 예약
```typescript
import * as NotificationService from './services/notificationService';

await NotificationService.scheduleRecordNotifications({
  id: recordId,
  title: '일정 제목',
  created_at: '2024-01-01T00:00:00Z',
  due_date: '2024-12-31T23:59:59Z',
});
```

### 3. 테스트 알림 발송 (백엔드)
```bash
curl -X POST http://localhost:3030/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "title": "테스트", "body": "알림 테스트"}'
```

---

## 🧪 테스트 방법

### 1단계: 로그인 후 토큰 확인
```
앱 실행 → 로그인 → 콘솔 확인
✅ FCM 토큰이 서버에 등록되었습니다.
```

### 2단계: 일정 생성 후 알림 예약 확인
```
일정 생성 → 마감일 설정 → 콘솔 확인
✅ 알림 예약됨: { dueNotificationId: '...' }
```

### 3단계: 테스트 알림 발송
```bash
curl -X POST http://localhost:3030/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"userId": 1}'
```

### 4단계: 스케줄러 수동 실행
```javascript
// backend/server.js에 임시 라우트 추가
app.get('/api/test/scheduler', async (req, res) => {
  await require('./services/schedulerService').runManually();
  res.json({ success: true });
});
```

---

## 🎨 커스터마이징 옵션

### 알림 시간 변경
```javascript
// backend/services/schedulerService.js
// 매일 오전 9시 → 원하는 시간으로 변경
cron.schedule('0 9 * * *', async () => { ... });
```

### 알림 채널 추가
```typescript
// src/services/notificationService.ts
await Notifications.setNotificationChannelAsync('urgent', {
  name: '긴급 알림',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 500, 500, 500],
  lightColor: '#FF0000',
});
```

### 알림 스타일 변경
```json
// app.json
{
  "plugins": [
    ["expo-notifications", {
      "icon": "./assets/notification-icon.png",
      "color": "#FF0000",
      "sounds": ["./assets/notification-sound.wav"]
    }]
  ]
}
```

---

## 📊 현재 상태

### ✅ 완료된 기능
- [x] FCM 토큰 관리
- [x] 푸시 알림 발송 (서버 → 앱)
- [x] 로컬 알림 예약 (일정 하루 전)
- [x] 일정 알림 스케줄러 (매일 오전 9시)
- [x] 토큰 자동 등록/제거
- [x] 포그라운드/백그라운드 알림
- [x] Android 알림 채널
- [x] 데이터베이스 마이그레이션
- [x] API 엔드포인트
- [x] 설정 가이드 문서

### 🔜 개선 가능한 기능
- [ ] 알림 ID를 DB에 저장하여 취소 가능하도록 개선
- [ ] 알림 설정 화면 (사용자가 알림 시간 조정)
- [ ] 알림 히스토리 조회
- [ ] 읽음/안 읽음 상태 관리
- [ ] 알림 그룹화
- [ ] Rich 알림 (이미지, 버튼 등)
- [ ] 조용한 시간 설정
- [ ] 토픽 구독 기능

---

## 🐛 알려진 이슈

1. **에뮬레이터에서 FCM 토큰을 받을 수 없음**
   - 해결: 실제 디바이스에서 테스트 필요

2. **iOS에서 알림이 표시되지 않음**
   - 해결: APNs 인증서 설정 필요 (FCM_SETUP_GUIDE.md 참고)

3. **알림 수정 시 기존 알림 취소 불가**
   - 원인: 알림 ID를 DB에 저장하지 않음
   - 해결: field_record 테이블에 notification_ids 컬럼 추가 필요

---

## 📚 관련 문서

- **FCM_SETUP_GUIDE.md** - Firebase 설정 상세 가이드
- **PROJECT_RULES.md** - 프로젝트 규칙
- **TROUBLESHOOTING.md** - 문제 해결 가이드

---

## 🎉 완료!

푸시 알림 시스템 구현이 모두 완료되었습니다!

### 다음 단계:
1. **`FCM_SETUP_GUIDE.md`** 파일을 보고 Firebase 프로젝트를 생성하세요.
2. 필요한 Firebase 키 파일들을 다운로드하여 추가하세요.
3. 데이터베이스 마이그레이션을 실행하세요.
4. 백엔드와 앱을 재시작하고 테스트하세요.

문제가 발생하면 **FCM_SETUP_GUIDE.md**의 "문제 해결" 섹션을 참고하세요!

