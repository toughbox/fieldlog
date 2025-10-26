/**
 * FCM 푸시 알림 서비스
 */

const admin = require('firebase-admin');
const db = require('../config/database');

// Firebase Admin 초기화 여부
let isInitialized = false;

/**
 * Firebase Admin SDK 초기화
 * @param {string} serviceAccountPath - Firebase 서비스 계정 키 파일 경로
 */
function initializeFirebase(serviceAccountPath) {
  try {
    if (isInitialized) {
      console.log('⚠️ Firebase Admin은 이미 초기화되었습니다.');
      return;
    }

    // 서비스 계정 키 파일이 제공되지 않은 경우
    if (!serviceAccountPath) {
      console.log('⚠️ Firebase 서비스 계정 키가 설정되지 않았습니다.');
      console.log('FCM 알림 기능을 사용하려면 firebase-service-account.json 파일을 추가하세요.');
      return;
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    isInitialized = true;
    console.log('✅ Firebase Admin SDK 초기화 완료');
  } catch (error) {
    console.error('❌ Firebase Admin SDK 초기화 실패:', error.message);
    console.log('FCM 알림 기능이 비활성화됩니다.');
  }
}

/**
 * FCM을 통해 특정 토큰들에게 알림 발송
 * @param {string[]} tokens - FCM 디바이스 토큰 배열
 * @param {string} title - 알림 제목
 * @param {string} body - 알림 내용
 * @param {object} data - 추가 데이터
 * @returns {Promise<object>} 발송 결과
 */
async function sendNotificationToTokens(tokens, title, body, data = {}) {
  if (!isInitialized) {
    console.log('⚠️ Firebase가 초기화되지 않아 알림을 발송할 수 없습니다.');
    return {
      success: false,
      message: 'Firebase가 초기화되지 않았습니다.'
    };
  }

  try {
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        // 모든 값은 문자열이어야 함
        timestamp: new Date().toISOString()
      },
      tokens: tokens.filter(token => token && token.trim() !== '')
    };

    // 데이터를 문자열로 변환
    Object.keys(message.data).forEach(key => {
      if (typeof message.data[key] !== 'string') {
        message.data[key] = JSON.stringify(message.data[key]);
      }
    });

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(`📤 알림 발송 완료: 성공 ${response.successCount}건, 실패 ${response.failureCount}건`);

    // 실패한 토큰 처리
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`토큰 ${tokens[idx].substring(0, 20)}... 발송 실패:`, resp.error);
          failedTokens.push(tokens[idx]);
        }
      });

      // 유효하지 않은 토큰 비활성화
      await deactivateInvalidTokens(failedTokens);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    };

  } catch (error) {
    console.error('❌ FCM 알림 발송 오류:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 특정 사용자에게 알림 발송
 * @param {number} userId - 사용자 ID
 * @param {string} title - 알림 제목
 * @param {string} body - 알림 내용
 * @param {object} data - 추가 데이터
 * @returns {Promise<object>} 발송 결과
 */
async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    // 사용자의 활성 토큰 조회
    const result = await db.query(
      'SELECT device_token FROM fieldlog.push_tokens WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`⚠️ 사용자 ${userId}의 활성 토큰이 없습니다.`);
      return {
        success: false,
        message: '등록된 디바이스가 없습니다.'
      };
    }

    const deviceTokens = result.rows.map(t => t.device_token);
    return await sendNotificationToTokens(deviceTokens, title, body, data);

  } catch (error) {
    console.error('❌ 사용자 알림 발송 오류:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 여러 사용자에게 알림 발송
 * @param {number[]} userIds - 사용자 ID 배열
 * @param {string} title - 알림 제목
 * @param {string} body - 알림 내용
 * @param {object} data - 추가 데이터
 * @returns {Promise<object>} 발송 결과
 */
async function sendNotificationToUsers(userIds, title, body, data = {}) {
  try {
    // 사용자들의 활성 토큰 조회
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await db.query(
      `SELECT device_token FROM fieldlog.push_tokens 
       WHERE user_id IN (${placeholders}) AND is_active = true`,
      userIds
    );

    if (result.rows.length === 0) {
      console.log('⚠️ 활성 토큰이 없습니다.');
      return {
        success: false,
        message: '등록된 디바이스가 없습니다.'
      };
    }

    const deviceTokens = result.rows.map(t => t.device_token);
    return await sendNotificationToTokens(deviceTokens, title, body, data);

  } catch (error) {
    console.error('❌ 다중 사용자 알림 발송 오류:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 유효하지 않은 토큰 비활성화
 * @param {string[]} tokens - 비활성화할 토큰 배열
 */
async function deactivateInvalidTokens(tokens) {
  if (tokens.length === 0) return;

  try {
    const placeholders = tokens.map((_, i) => `$${i + 1}`).join(',');
    await db.query(
      `UPDATE fieldlog.push_tokens SET is_active = false 
       WHERE device_token IN (${placeholders})`,
      tokens
    );
    console.log(`🗑️ ${tokens.length}개의 유효하지 않은 토큰을 비활성화했습니다.`);
  } catch (error) {
    console.error('❌ 토큰 비활성화 오류:', error);
  }
}

module.exports = {
  initializeFirebase,
  sendNotificationToTokens,
  sendNotificationToUser,
  sendNotificationToUsers
};

