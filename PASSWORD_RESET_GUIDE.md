# 비밀번호 재설정 기능 가이드

## 📧 기능 개요

이메일 발송과 비밀번호 재설정 기능이 추가되었습니다.

### 주요 기능
- ✅ 이메일로 6자리 재설정 토큰 발송
- ✅ 10분 제한 시간
- ✅ 토큰 일회성 사용
- ✅ 보안 강화 (이메일 존재 여부 노출 방지)
- ✅ 비밀번호 변경 완료 알림 이메일

---

## 🚀 사용 방법

### 1. 사용자 입장 (앱)

#### 비밀번호 찾기
1. 로그인 화면에서 **"비밀번호 찾기"** 클릭
2. 가입한 이메일 주소 입력
3. **"재설정 안내 받기"** 버튼 클릭
4. 이메일로 받은 6자리 토큰 확인

#### 비밀번호 재설정
1. 이메일로 받은 **6자리 토큰** 입력
2. **새 비밀번호** 입력 (6자 이상)
3. **비밀번호 확인** 재입력
4. **"비밀번호 변경하기"** 버튼 클릭
5. 변경 완료! 새 비밀번호로 로그인

---

## ⚙️ 백엔드 설정

### 1. 환경변수 설정 (.env 파일)

#### 개발 환경 (이메일 설정 없이)
```bash
NODE_ENV=development
# 이메일 설정 없음 → 콘솔에 토큰 출력
```

콘솔에 다음과 같이 토큰이 출력됩니다:
```
📧 [개발 모드] 비밀번호 재설정 이메일:
수신자: user@example.com
이름: 홍길동
재설정 토큰: 123456
토큰은 10분간 유효합니다.
```

#### Gmail 사용 (프로덕션)
```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=FieldLog <your-email@gmail.com>
```

**Gmail 앱 비밀번호 생성 방법:**
1. Google 계정 관리 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. 생성된 16자리 비밀번호를 `EMAIL_PASSWORD`에 입력

#### 커스텀 SMTP 서버 사용
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM=FieldLog <noreply@example.com>
```

### 2. 백엔드 재시작
```bash
cd backend
npm run dev
```

---

## 🔌 API 엔드포인트

### 1. 비밀번호 재설정 요청
```http
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**응답 (성공):**
```json
{
  "success": true,
  "message": "이메일로 비밀번호 재설정 안내가 발송되었습니다.",
  "dev_token": "123456"  // 개발 환경에서만
}
```

### 2. 토큰 확인
```http
POST /api/auth/verify-reset-token
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "123456"
}
```

### 3. 비밀번호 재설정
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "123456",
  "newPassword": "newpassword123"
}
```

---

## 📱 프론트엔드 화면

### 추가된 화면
1. **ForgotPasswordScreen** - 비밀번호 찾기
2. **ResetPasswordScreen** - 비밀번호 재설정

### 네비게이션
```typescript
// 로그인 화면에서
navigation.navigate('ForgotPassword');

// 비밀번호 찾기에서
navigation.navigate('ResetPassword', { email: 'user@example.com' });
```

---

## 🔒 보안 기능

### 1. 토큰 관리
- ✅ **6자리 숫자** 토큰 (암호화 없이 전송)
- ✅ **10분 유효기간**
- ✅ **일회성 사용** (사용 후 자동 폐기)
- ✅ 만료된 토큰 자동 정리 (5분마다)

### 2. 이메일 존재 여부 숨김
사용자가 존재하지 않아도 "이메일이 발송되었습니다" 메시지 표시
→ 이메일 존재 여부 탐지 방지

### 3. 비밀번호 검증
- 최소 6자 이상
- bcrypt 해싱 (saltRounds: 12)

---

## 🎨 이메일 템플릿

### 재설정 요청 이메일
- 📧 제목: "FieldLog 비밀번호 재설정"
- 🎨 HTML 템플릿 (그라데이션 헤더, 토큰 박스)
- ⏰ 10분 유효기간 안내
- ⚠️ 보안 경고 문구

### 변경 완료 이메일
- 📧 제목: "FieldLog 비밀번호가 변경되었습니다"
- ✅ 변경 완료 알림
- ⚠️ 본인이 아닐 경우 연락 안내

---

## 🧪 테스트 방법

### 개발 환경 테스트
1. 백엔드 실행 (이메일 설정 없이)
```bash
cd backend
npm run dev
```

2. 앱 실행
```bash
npx expo start
```

3. 비밀번호 찾기 테스트
   - 로그인 화면 → "비밀번호 찾기"
   - 이메일 입력 후 요청
   - **콘솔에서 토큰 확인**
   - 토큰 입력 후 비밀번호 변경

### 프로덕션 테스트
1. Gmail 앱 비밀번호 설정
2. `.env` 파일 업데이트
3. 백엔드 재시작
4. 실제 이메일 수신 확인

---

## ⚠️ 주의사항

### 개발 환경
- 이메일 설정 없이도 작동 (콘솔 출력)
- `dev_token` 필드로 토큰 반환

### 프로덕션 환경
- 반드시 이메일 설정 필요
- `dev_token` 필드 자동 제거
- HTTPS 사용 권장

### 토큰 저장소
- 현재: **메모리 저장** (서버 재시작 시 초기화)
- 권장: **Redis** 또는 **DB** 사용 (프로덕션)

---

## 🔧 트러블슈팅

### 이메일이 오지 않을 때
1. **스팸함 확인**
2. **Gmail 앱 비밀번호 확인**
3. **환경변수 설정 확인**
4. **백엔드 콘솔 로그 확인**

### 토큰 오류
- "유효하지 않은 토큰" → 토큰 재확인
- "토큰이 만료되었습니다" → 재요청
- "이미 사용된 토큰" → 재요청

### Gmail 오류
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
→ 앱 비밀번호 사용 확인 (일반 비밀번호 X)

---

## 📝 추가 개선 사항

### 단기
- [ ] 토큰 요청 횟수 제한 (Rate Limiting)
- [ ] 토큰 재발송 기능
- [ ] 이메일 템플릿 커스터마이징

### 장기
- [ ] Redis로 토큰 저장소 전환
- [ ] SMS 인증 추가
- [ ] 비밀번호 히스토리 관리
- [ ] 로그인 알림 기능

---

## 📞 문의

문제가 발생하면 백엔드 로그를 확인하세요:
```bash
cd backend
npm run dev
```

또는 이슈를 등록해주세요.

