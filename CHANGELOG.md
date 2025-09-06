# 변경 이력 (Changelog)

## [1.1.0] - 2024-01-XX

### 🔄 Major Changes
- **UI 라이브러리 변경**: React Native Paper → Tamagui
  - 성능 최적화 및 더 나은 개발 경험을 위한 변경
  - 모든 화면 컴포넌트 마이그레이션 완료

### ➕ Added
- Tamagui 설정 파일 (`tamagui.config.ts`)
- Babel 및 Metro 설정에 Tamagui 플러그인 추가
- 프로젝트 룰 문서 (`PROJECT_RULES.md`)
- 패키지 변경 체크리스트 (`PACKAGE_CHANGE_CHECKLIST.md`)

### 🔧 Changed
- `App.tsx`: PaperProvider → TamaguiProvider
- `LoginScreen.tsx`: Paper 컴포넌트 → Tamagui 컴포넌트
- `HomeScreen.tsx`: Paper 컴포넌트 → Tamagui 컴포넌트
- 스타일링 방식: StyleSheet → Tamagui 토큰 시스템

### ❌ Removed
- React Native Paper 의존성
- React Native Elements 의존성  
- React Native Vector Icons 의존성
- 모든 StyleSheet 기반 스타일 코드

### 📦 Dependencies
**Added:**
- `@tamagui/core`
- `@tamagui/config`
- `@tamagui/animations-react-native`
- `@tamagui/font-inter`
- `@tamagui/theme-base`
- `@tamagui/babel-plugin`
- `@tamagui/metro-plugin`

**Removed:**
- `react-native-paper`
- `react-native-elements`
- `react-native-vector-icons`

### 🐛 Known Issues
- Expo 패키지 버전 호환성 경고 (기능에는 영향 없음)
  - `react-native@0.79.6` (권장: 0.79.5)
  - `react-native-reanimated@4.1.0` (권장: ~3.17.4)
  - `react-native-safe-area-context@5.6.1` (권장: 5.4.0)
  - `react-native-screens@4.16.0` (권장: ~4.11.1)
  - `react-native-svg@15.12.1` (권장: 15.11.2)

---

## [1.0.0] - 2024-01-XX

### 🎉 Initial Release
- React Native + Expo 기반 현장기록 앱 초기 버전
- 로그인 화면 구현
- 홈 화면 대시보드 구현
- React Native Paper UI 라이브러리 사용

---

## 📝 변경 이력 작성 가이드

### 버전 번호 규칙
- **Major (X.0.0)**: 호환성을 깨는 변경사항
- **Minor (0.X.0)**: 새로운 기능 추가 (하위 호환)
- **Patch (0.0.X)**: 버그 수정 (하위 호환)

### 카테고리
- `🔄 Major Changes`: 중요한 변경사항
- `➕ Added`: 새로운 기능
- `🔧 Changed`: 기존 기능 변경
- `❌ Removed`: 제거된 기능
- `🐛 Fixed`: 버그 수정
- `📦 Dependencies`: 의존성 변경
- `⚠️ Deprecated`: 향후 제거 예정 기능

**모든 변경사항은 이 파일에 기록해주세요!**
