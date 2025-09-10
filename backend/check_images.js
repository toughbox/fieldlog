const { query } = require('./config/database');

async function checkImages() {
  try {
    console.log('🔍 이미지가 있는 기록들 확인 중...');
    
    const result = await query(`
      SELECT id, title, attachment 
      FROM fieldlog.field_record 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`\n📋 이미지가 있는 기록 ${result.rows.length}개:`);
    result.rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}`);
      console.log(`   제목: ${row.title}`);
      console.log(`   첨부파일: ${JSON.stringify(row.attachment)}`);
    });
    
    if (result.rows.length === 0) {
      console.log('\n❌ 이미지가 첨부된 기록이 없습니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

checkImages();
