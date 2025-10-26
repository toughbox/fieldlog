# Firebase Cloud Messaging (FCM) 설정 가이드

FieldLog 앱의 푸시 알림 기능을 사용하기 위한 Firebase 설정 방법입니다.

## 📋 목차
1. [Firebase 프로젝트 생성](#1-firebase-프로젝트-생성)
2. [Android 앱 설정](#2-android-앱-설정)
3. [iOS 앱 설정](#3-ios-앱-설정)
4. [백엔드 설정](#4-백엔드-설정)
5. [데이터베이스 마이그레이션](#5-데이터베이스-마이그레이션)
6. [테스트](#6-테스트)

---

## 1. Firebase 프로젝트 생성

### 1.1 Firebase 콘솔 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `fieldlog-app`)
4. Google 애널리틱스는 선택 사항 (나중에 추가 가능)
5. 프로젝트 생성 완료

---

## 2. Android 앱 설정

### 2.1 Android 앱 등록
1. Firebase 프로젝트에서 "프로젝트 설정" → "내 앱" 선택
2. Android 아이콘 클릭
3. **Android 패키지 이름** 입력: `com.toughbox.fieldlog` (app.json의 package 값과 동일해야 함)
4. 앱 닉네임 입력 (선택): `FieldLog Android`
5. 디버그 서명 인증서 SHA-1은 선택 사항 (개발 단계에서는 생략 가능)
6. "앱 등록" 클릭

### 2.2 google-services.json 다운로드
1. `google-services.json` 파일 다운로드
2. 프로젝트의 **`android/app/`** 폴더에 복사

```bash
# 올바른 위치
C:\project\fieldlog\android\app\google-services.json
```

### 2.3 Android 빌드 설정 (Expo 사용 시 자동)
- Expo를 사용하는 경우 `app.json`에 이미 설정되어 있습니다:
```json
{
  "android": {
    "googleServicesFile": "./android/app/google-services.json"
  }
}
```

---

## 3. iOS 앱 설정

### 3.1 iOS 앱 등록
1. Firebase 프로젝트에서 "프로젝트 설정" → "내 앱" 선택
2. iOS 아이콘 클릭
3. **iOS 번들 ID** 입력: `com.toughbox.fieldlog` (app.json의 bundleIdentifier와 동일)
4. 앱 닉네임 입력 (선택): `FieldLog iOS`
5. App Store ID는 선택 사항
6. "앱 등록" 클릭

### 3.2 GoogleService-Info.plist 다운로드
1. `GoogleService-Info.plist` 파일 다운로드
2. 프로젝트의 **`ios/`** 폴더에 복사

```bash
# 올바른 위치
C:\project\fieldlog\ios\GoogleService-Info.plist
```

### 3.3 iOS APNs 인증서 설정 (필수)
1. Firebase Console에서 "프로젝트 설정" → "Cloud Messaging" 탭 선택
2. "APNs 인증서" 섹션에서 인증서 업로드
3. Apple Developer Portal에서 APNs 인증서 생성 및 다운로드
4. `.p8` 또는 `.p12` 인증서를 Firebase에 업로드

---

## 4. 백엔드 설정

### 4.1 Firebase Admin SDK 서비스 계정 키 생성
1. Firebase Console에서 "프로젝트 설정" → "서비스 계정" 탭 선택
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. 파일 이름을 `firebase-service-account.json`으로 변경
5. **`backend/`** 폴더에 복사

```bash
# 올바른 위치
C:\project\fieldlog\backend\firebase-service-account.json
```

### 4.2 .gitignore 확인
보안을 위해 Firebase 키 파일이 Git에 커밋되지 않도록 확인:

```bash
# backend/.gitignore 또는 루트 .gitignore에 추가
firebase-service-account.json
google-services.json
GoogleService-Info.plist
```

---

## 5. 데이터베이스 마이그레이션

### 5.1 push_tokens 테이블 생성
백엔드 데이터베이스에 푸시 토큰 테이블을 생성합니다:

```bash
# PostgreSQL 사용 시
cd backend
psql -U your_username -d fieldlog < migrations/add_push_tokens_table.sql

# SQLite 사용 시
sqlite3 backend/fieldlog.db < backend/migrations/add_push_tokens_table.sql
```

또는 SQL 클라이언트에서 직접 실행:
```sql
-- backend/migrations/add_push_tokens_table.sql 파일의 내용 실행
```

---

## 6. 테스트

### 6.1 백엔드 서버 시작
```bash
cd backend
npm start
```

다음 메시지가 출력되면 성공:
```
✅ Firebase Admin SDK 초기화 완료
📅 일정 알림 스케줄러 시작
✅ 스케줄러 등록 완료 (매일 오전 9시 실행)
🚀 FieldLog API 서버가 포트 3030에서 실행 중입니다.
📱 푸시 알림 기능 활성화
```

### 6.2 프론트엔드 앱 시작
```bash
npm start
```

### 6.3 테스트 단계

#### ✅ 1단계: 로그인 및 토큰 등록 확인
1. 앱 실행 및 로그인
2. 푸시 알림 권한 요청 팝업에서 "허용" 선택
3. 콘솔 로그 확인:
```
📱 FCM 토큰 준비됨: ...
✅ FCM 토큰이 서버에 등록되었습니다.
```

#### ✅ 2단계: 테스트 알림 발송
백엔드 API를 통해 테스트 알림 발송:

```bash
# curl 사용
curl -X POST http://localhost:3030/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "title": "테스트", "body": "알림 테스트입니다"}'

# Postman 사용
POST http://localhost:3030/api/notifications/test
Body (JSON):
{
  "userId": 1,
  "title": "테스트 알림",
  "body": "푸시 알림이 정상적으로 작동합니다!"
}
```

#### ✅ 3단계: 로컬 알림 테스트
1. 새로운 일정 생성
2. 마감일을 내일로 설정
3. 일정 생성 후 콘솔 로그 확인:
```
✅ 알림 예약됨: { dueNotificationId: '...' }
```

#### ✅ 4단계: 스케줄러 테스트
백엔드 콘솔에서 수동 실행:
```javascript
// backend/server.js에 임시 라우트 추가 (테스트용)
app.get('/api/test/scheduler', async (req, res) => {
  const schedulerService = require('./services/schedulerService');
  await schedulerService.runManually();
  res.json({ success: true, message: '스케줄러 실행 완료' });
});
```

브라우저 또는 curl로 호출:
```bash
curl http://localhost:3030/api/test/scheduler
```

---

## 🔧 문제 해결

### Firebase 초기화 실패
**증상**: "Firebase가 초기화되지 않았습니다"
**해결**:
1. `firebase-service-account.json` 파일이 `backend/` 폴더에 있는지 확인
2. 파일 내용이 유효한 JSON인지 확인
3. Firebase 프로젝트 ID가 올바른지 확인

### Android 빌드 오류
**증상**: "google-services.json not found"
**해결**:
1. `google-services.json`이 `android/app/` 폴더에 있는지 확인
2. 패키지 이름이 `app.json`과 일치하는지 확인
3. `npx expo prebuild --clean` 실행

### iOS 빌드 오류
**증상**: "GoogleService-Info.plist not found"
**해결**:
1. `GoogleService-Info.plist`가 `ios/` 폴더에 있는지 확인
2. 번들 ID가 `app.json`과 일치하는지 확인
3. Xcode에서 직접 파일 추가

### FCM 토큰을 받을 수 없음
**증상**: getFCMToken()이 null 반환
**해결**:
1. 실제 디바이스에서 테스트 (에뮬레이터는 FCM 미지원)
2. Google Play Services가 설치되어 있는지 확인 (Android)
3. APNs 인증서가 올바르게 설정되어 있는지 확인 (iOS)

### 알림이 수신되지 않음
**증상**: 알림 발송은 성공하지만 디바이스에 표시 안됨
**해결**:
1. 디바이스 알림 설정 확인 (시스템 설정)
2. 앱이 백그라운드에서 실행 중인지 확인
3. 방해금지 모드 해제
4. FCM 토큰이 유효한지 확인 (만료 시 재발급 필요)

---

## 📚 추가 자료

- [Firebase Cloud Messaging 공식 문서](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications 문서](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Firebase 문서](https://rnfirebase.io/)

---

## 🎯 다음 단계

Firebase 설정이 완료되었습니다! 이제 다음 기능을 추가할 수 있습니다:

1. **알림 커스터마이징**: 알림 아이콘, 소리, 진동 패턴 변경
2. **알림 카테고리**: 중요도별 알림 채널 추가
3. **알림 액션**: 알림에서 직접 작업 수행 (완료 표시, 연기 등)
4. **알림 그룹화**: 여러 알림을 그룹으로 표시
5. **조용한 시간**: 특정 시간대 알림 음소거
6. **토픽 구독**: 특정 주제에 대한 알림 구독

---

## ✅ 체크리스트

설정이 완료되었는지 확인하세요:

- [ ] Firebase 프로젝트 생성
- [ ] Android 앱 등록 및 google-services.json 추가
- [ ] iOS 앱 등록 및 GoogleService-Info.plist 추가
- [ ] APNs 인증서 설정 (iOS)
- [ ] Firebase Admin SDK 서비스 계정 키 생성 및 추가
- [ ] 데이터베이스 마이그레이션 (push_tokens 테이블)
- [ ] 백엔드 서버 시작 및 Firebase 초기화 확인
- [ ] 앱에서 푸시 알림 권한 요청 확인
- [ ] FCM 토큰 서버 등록 확인
- [ ] 테스트 알림 발송 및 수신 확인
- [ ] 로컬 알림 예약 확인
- [ ] 스케줄러 동작 확인

모든 항목을 체크했다면 푸시 알림 시스템이 정상적으로 작동합니다! 🎉

