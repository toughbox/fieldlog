import { registerRootComponent } from 'expo';
import App from './App';

// 전역 오류 핸들러 설정
if (typeof global.ErrorUtils !== 'undefined') {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('🚨 전역 오류:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      isFatal
    });

    // 원본 핸들러 호출
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// 런타임 환경 정보 로깅
console.log('🌍 런타임 환경:', {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch
});

registerRootComponent(App);
