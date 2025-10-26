/**
 * 푸시 알림 관련 API 라우터
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * POST /api/notifications/register-token
 * 디바이스 토큰 등록/업데이트
 */
router.post('/register-token', async (req, res) => {
  try {
    const { userId, deviceToken, deviceType, deviceInfo } = req.body;

    // 입력 검증
    if (!userId || !deviceToken || !deviceType) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다. (userId, deviceToken, deviceType)'
      });
    }

    if (!['ios', 'android'].includes(deviceType)) {
      return res.status(400).json({
        success: false,
        message: 'deviceType은 ios 또는 android여야 합니다.'
      });
    }

    // 같은 토큰이 이미 존재하는지 확인
    console.log(`🔍 토큰 확인 중: userId=${userId}, deviceType=${deviceType}, token=${deviceToken.substring(0, 20)}...`);
    
    const existingToken = await db.query(
      'SELECT * FROM fieldlog.push_tokens WHERE device_token = $1',
      [deviceToken]
    );

    console.log(`📊 기존 토큰 존재 여부: ${existingToken.rows.length > 0 ? 'YES' : 'NO'}`);

    if (existingToken.rows.length > 0) {
      // 기존 토큰 업데이트 (사용자가 변경되었을 수도 있음)
      await db.query(
        `UPDATE fieldlog.push_tokens 
         SET user_id = $1, 
             device_type = $2, 
             device_info = $3,
             is_active = true,
             last_used_at = NOW()
         WHERE device_token = $4`,
        [userId, deviceType, JSON.stringify(deviceInfo || {}), deviceToken]
      );

      console.log(`✅ 토큰 업데이트됨: 사용자 ${userId}, 타입 ${deviceType}`);
    } else {
      // 새 토큰 등록
      await db.query(
        `INSERT INTO fieldlog.push_tokens (user_id, device_token, device_type, device_info)
         VALUES ($1, $2, $3, $4)`,
        [userId, deviceToken, deviceType, JSON.stringify(deviceInfo || {})]
      );

      console.log(`✅ 새 토큰 등록됨: 사용자 ${userId}, 타입 ${deviceType}`);
    }

    res.json({
      success: true,
      message: '디바이스 토큰이 성공적으로 등록되었습니다.'
    });

  } catch (error) {
    console.error('디바이스 토큰 등록 오류:', error);
    res.status(500).json({
      success: false,
      message: '디바이스 토큰 등록 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * DELETE /api/notifications/unregister-token
 * 디바이스 토큰 제거 (로그아웃 시)
 */
router.delete('/unregister-token', async (req, res) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: 'deviceToken이 필요합니다.'
      });
    }

    await db.query(
      'UPDATE fieldlog.push_tokens SET is_active = false WHERE device_token = $1',
      [deviceToken]
    );

    console.log(`✅ 토큰 비활성화됨: ${deviceToken.substring(0, 20)}...`);

    res.json({
      success: true,
      message: '디바이스 토큰이 비활성화되었습니다.'
    });

  } catch (error) {
    console.error('디바이스 토큰 제거 오류:', error);
    res.status(500).json({
      success: false,
      message: '디바이스 토큰 제거 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/user-tokens/:userId
 * 특정 사용자의 모든 활성 토큰 조회
 */
router.get('/user-tokens/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      'SELECT * FROM fieldlog.push_tokens WHERE user_id = $1 AND is_active = true ORDER BY last_used_at DESC',
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('사용자 토큰 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 토큰 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/test
 * 테스트 알림 발송 (개발용)
 */
router.post('/test', async (req, res) => {
  try {
    const { userId, title, body } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId가 필요합니다.'
      });
    }

    // 사용자의 활성 토큰 조회
    const result = await db.query(
      'SELECT device_token FROM fieldlog.push_tokens WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '등록된 디바이스가 없습니다.'
      });
    }

    // FCM 서비스를 통해 알림 발송 (services/notificationService.js에서 구현)
    const notificationService = require('../services/notificationService');
    const results = await notificationService.sendNotificationToTokens(
      result.rows.map(t => t.device_token),
      title || '테스트 알림',
      body || '푸시 알림 테스트입니다.',
      { test: true }
    );

    res.json({
      success: true,
      message: '테스트 알림이 발송되었습니다.',
      results
    });

  } catch (error) {
    console.error('테스트 알림 발송 오류:', error);
    res.status(500).json({
      success: false,
      message: '테스트 알림 발송 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;

