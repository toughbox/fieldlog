#!/usr/bin/env node
/**
 * 크로스 플랫폼 환경 파일 복사 스크립트
 * Windows, Linux, Mac 모두에서 작동
 */

const fs = require('fs');
const path = require('path');

const envType = process.argv[2]; // 'local' 또는 'production'

if (!envType || !['local', 'production'].includes(envType)) {
  console.error('❌ 사용법: node copy-env.js [local|production]');
  process.exit(1);
}

const sourceFile = path.join(__dirname, '..', `.env.${envType}`);
const targetFile = path.join(__dirname, '..', '.env');

try {
  // 소스 파일 존재 확인
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ 환경 파일을 찾을 수 없습니다: ${sourceFile}`);
    console.log('');
    console.log('💡 먼저 환경 파일을 생성하세요:');
    console.log('   PowerShell: .\\scripts\\create-env-files.ps1');
    console.log('   Bash: ./scripts/create-env-files.sh');
    process.exit(1);
  }

  // 파일 복사
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`✅ 환경 파일 복사 완료: .env.${envType} → .env`);
} catch (error) {
  console.error(`❌ 환경 파일 복사 실패: ${error.message}`);
  process.exit(1);
}

