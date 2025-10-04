const { query } = require('./config/database');

async function checkAttachments() {
  try {
    console.log('🔍 최근 기록들의 첨부파일 확인 중...');
    
    const result = await query(`
      SELECT id, title, attachment, created_at 
      FROM fieldlog.field_record 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`\n📋 최근 ${result.rows.length}개 기록:`);
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}`);
      console.log(`   제목: ${row.title}`);
      console.log(`   첨부파일: ${JSON.stringify(row.attachment)}`);
      console.log(`   생성일: ${row.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

checkAttachments();
