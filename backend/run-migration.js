/**
 * Push Tokens 테이블 마이그레이션 실행 스크립트
 */

const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function runMigration() {
  try {
    console.log('🔄 마이그레이션 시작...');
    
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'migrations', 'add_push_tokens_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // SQL 실행
    await db.query(sql);
    
    console.log('✅ 마이그레이션 완료!');
    console.log('📋 push_tokens 테이블이 성공적으로 생성되었습니다.');
    
    // 테이블 확인
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'push_tokens'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ 테이블 존재 확인됨');
    } else {
      console.log('❌ 테이블이 생성되지 않았습니다.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

runMigration();

