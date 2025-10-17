완벽합니다! 🎉 문제 해결 과정을 정리해드리겠습니다.

## 📋 문제 원인 및 해결 방법 정리

### 🔴 **핵심 문제**

APK로 빌드하면 **192.168.0.19 (로컬 IP)**로 API 요청이 가고, 실제 서버 **toughdev.cafe24.com**으로 연결이 안됨

---

## 🔍 **원인 분석**

### 1️⃣ **환경 변수 파일 우선순위 문제** (가장 큰 원인)

```
.env.local        ← 최우선 (192.168.0.19 설정)
.env              ← 무시됨
.env.production   ← 무시됨
```

**문제**: `.env.local` 파일이 있으면 다른 모든 환경 변수 파일을 무시하고 이것이 적용됨

**해결**: `.env.local` 삭제

```powershell
Remove-Item .env.local -Force
node scripts/copy-env.js production
```

---

### 2️⃣ **JavaScript 번들 캐싱 문제**

**문제**: Gradle 빌드 시 이전에 생성된 JavaScript 번들을 재사용
- 환경 변수를 변경해도 번들이 새로 생성되지 않음
- 이전 설정(192.168.0.19)이 번들에 포함된 채로 계속 사용됨

**해결**: JavaScript 번들을 강제로 새로 생성

```powershell
# 기존 번들 삭제
Remove-Item -Recurse -Force android\app\build\generated\assets

# 새 번들 생성 (환경 변수 포함)
npx expo export --platform android
```

---

### 3️⃣ **Android HTTP 접속 제한**

**문제**: Android 9 이상에서는 기본적으로 HTTP(비암호화) 접속 차단

**해결**: Network Security Config 파일 추가

**파일 생성**: `android/app/src/main/res/xml/network_security_config.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">toughdev.cafe24.com</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
```

**AndroidManifest.xml 수정**:
```xml
<application
  android:networkSecurityConfig="@xml/network_security_config"
  android:usesCleartextTraffic="true"
  ...>
```

---

## ✅ **최종 해결 방법**

### **전체 프로세스**:

```powershell
# 1. 환경 변수 정리
Remove-Item .env.local -Force
node scripts/copy-env.js production

# 2. .env 내용 확인
type .env
# EXPO_PUBLIC_API_HOST=toughdev.cafe24.com 확인

# 3. 기존 번들 삭제
Remove-Item -Recurse -Force android\app\build\generated\assets -ErrorAction SilentlyContinue

# 4. JavaScript 번들 새로 생성
npx expo export --platform android --output-dir android/app/build/generated/assets/react/release

# 5. Android 빌드
cd android
.\gradlew assembleRelease
cd ..

# 6. APK 설치
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" uninstall com.toughbox.fieldlog
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install android\app\build\outputs\apk\release\app-release.apk
```

---

## 📝 **다음에 대비하기 위한 체크리스트**

### **APK 빌드 전 필수 확인 사항**:

- [ ] `.env.local` 파일 삭제 또는 내용 확인
- [ ] `.env` 파일이 올바른 서버 주소로 설정됨
- [ ] JavaScript 번들 새로 생성 (`npx expo export`)
- [ ] Gradle clean build (`.\gradlew clean`)
- [ ] 기존 APK 삭제 후 새로 설치

### **환경별 설정**:

```bash
# 로컬 개발
npm run start:local  # .env.local 사용

# 운영 서버 테스트
Remove-Item .env.local
npm run start:production  # .env.production → .env 복사

# APK 빌드
Remove-Item .env.local
npx expo export --platform android
cd android && .\gradlew assembleRelease
```

---

## 💡 **핵심 교훈**

1. **`.env.local`이 최우선**: 있으면 다른 모든 환경 변수 무시
2. **JavaScript 번들 = 빌드 시점 고정**: 환경 변수도 번들에 포함되어 고정됨
3. **Gradle은 캐시를 적극 활용**: 명시적으로 번들을 새로 생성해야 함
4. **Android Studio 개발 ≠ APK**: 
   - Android Studio = Metro 서버에서 실시간 로드
   - APK = 빌드 시점의 코드/설정 고정

---

이 내용을 `TROUBLESHOOTING.md` 파일로 저장해두시면 좋습니다! 🚀