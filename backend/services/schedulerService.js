/**
 * 일정 알림 스케줄러
 * 매일 정해진 시간에 내일 시작/만료되는 일정을 확인하고 알림 발송
 */

const cron = require('node-cron');
const db = require('../config/database');
const notificationService = require('./notificationService');

/**
 * 일정 알림 스케줄러 시작
 */
function startScheduler() {
  console.log('📅 일정 알림 스케줄러 시작');

  // 매일 오전 9시에 실행 (0 9 * * *)
  // 테스트를 위해 매 분마다 실행: * * * * *
  // 실제 운영: 0 9 * * *
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ 일정 알림 스케줄러 실행:', new Date().toLocaleString('ko-KR'));
    await checkAndSendNotifications();
  });

  console.log('✅ 스케줄러 등록 완료 (매일 오전 9시 실행)');
}

/**
 * 내일 시작/만료되는 일정 확인 및 알림 발송
 */
async function checkAndSendNotifications() {
  try {
    // 내일 날짜 계산
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

    console.log('📆 내일 날짜:', tomorrowStart.toLocaleDateString('ko-KR'));

    // 1. 내일 만료되는 일정 확인 (due_date 기준)
    await checkDueDateReminders(tomorrowStart, tomorrowEnd);

    // 2. 내일 시작하는 일정 확인 (created_at 기준 - 실제로는 별도 start_date 필드가 있으면 더 좋음)
    // 현재 스키마에는 start_date가 없으므로 due_date만 체크
    // 필요시 created_at 기준으로 1년 후 시작 로직 추가

  } catch (error) {
    console.error('❌ 알림 스케줄러 오류:', error);
  }
}

/**
 * 만료일 알림 확인 및 발송
 */
async function checkDueDateReminders(tomorrowStart, tomorrowEnd) {
  try {
    // 내일 만료되는 미완료 일정 조회
    const result = await db.query(
      `SELECT 
        fr.id, 
        fr.user_id, 
        fr.title, 
        fr.due_date,
        fr.status,
        u.name as user_name,
        u.email as user_email
       FROM fieldlog.field_record fr
       JOIN fieldlog."user" u ON fr.user_id = u.id
       WHERE fr.due_date >= $1 
         AND fr.due_date <= $2
         AND fr.status NOT IN ('completed', 'cancelled')
         AND fr.is_deleted = false`,
      [tomorrowStart.toISOString(), tomorrowEnd.toISOString()]
    );

    const records = result.rows;
    console.log(`📋 내일 만료되는 일정: ${records.length}건`);

    if (records.length === 0) {
      return;
    }

    // 각 일정에 대해 알림 발송
    for (const record of records) {
      try {
        const result = await notificationService.sendNotificationToUser(
          record.user_id,
          '일정 만료 임박 ⏰',
          `"${record.title}" 일정이 내일 만료됩니다.`,
          {
            recordId: record.id.toString(),
            type: 'due_reminder',
            dueDate: record.due_date
          }
        );

        if (result.success) {
          console.log(`✅ 만료 알림 발송: ${record.user_name} - ${record.title}`);
          
          // 알림 로그 기록 (notification_log 테이블이 있다면)
          await logNotification(
            record.user_id,
            record.id,
            'due_date',
            'push',
            '일정 만료 임박',
            `"${record.title}" 일정이 내일 만료됩니다.`
          );
        } else {
          console.log(`⚠️ 만료 알림 발송 실패: ${record.user_name} - ${record.title}`);
        }
      } catch (error) {
        console.error(`❌ 일정 ${record.id} 알림 발송 오류:`, error);
      }
    }

  } catch (error) {
    console.error('❌ 만료일 알림 확인 오류:', error);
  }
}

/**
 * 시작일 알림 확인 및 발송 (필요시 구현)
 */
async function checkStartDateReminders(tomorrowStart, tomorrowEnd) {
  // TODO: start_date 필드가 추가되면 구현
  // 현재는 created_at을 기준으로 하기 어려우므로 생략
}

/**
 * 알림 로그 기록
 */
async function logNotification(userId, recordId, type, channel, title, message) {
  try {
    // notification_log 테이블이 있는지 확인
    const tableExists = await db.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'fieldlog' AND table_name = 'notification_log'`
    );

    if (tableExists.rows.length > 0) {
      await db.query(
        `INSERT INTO fieldlog.notification_log 
         (user_id, record_id, notification_type, channel, title, message, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, recordId, type, channel, title, message]
      );
    }
  } catch (error) {
    // 로그 기록 실패는 무시 (중요하지 않음)
    console.error('알림 로그 기록 실패:', error.message);
  }
}

/**
 * 수동으로 알림 확인 실행 (테스트용)
 */
async function runManually() {
  console.log('🔧 수동 알림 확인 시작...');
  await checkAndSendNotifications();
}

module.exports = {
  startScheduler,
  runManually,
  checkAndSendNotifications
};

