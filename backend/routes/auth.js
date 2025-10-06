const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const { sendPasswordResetEmail, sendPasswordResetConfirmationEmail } = require('../services/emailService');

const router = express.Router();

// 비밀번호 재설정 토큰 저장소 (메모리) - 프로덕션에서는 Redis나 DB 사용 권장
const resetTokens = new Map(); // { email: { token, expiresAt, used } }

// 회원가입 API
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, company } = req.body;

    // 필수 필드 검증
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '이름, 이메일, 비밀번호는 필수 입력 항목입니다.'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: '올바른 이메일 형식을 입력해주세요.'
      });
    }

    // 비밀번호 강도 검증
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: '비밀번호는 6자 이상이어야 합니다.'
      });
    }

    // 이메일 중복 확인
    const existingUser = await query(
      'SELECT id FROM fieldlog.user WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: '이미 사용 중인 이메일입니다.'
      });
    }

    // 비밀번호 해싱
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 사용자 등록
    const result = await query(
      `INSERT INTO fieldlog.user (name, email, password_hash, phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING id, name, email, phone, created_at`,
      [name.trim(), email.toLowerCase(), passwordHash, phone?.trim() || null]
    );

    const newUser = result.rows[0];

    console.log('✅ 새 사용자 등록 성공:', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name
    });

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        created_at: newUser.created_at
      },
      message: '회원가입이 완료되었습니다.'
    });

  } catch (error) {
    console.error('❌ 회원가입 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원가입 중 오류가 발생했습니다.'
    });
  }
});

// 로그인 API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 조회
    const result = await query(
      `SELECT id, name, email, password_hash, phone, is_active, created_at
       FROM fieldlog.user 
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 계정 활성화 상태 확인
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: '비활성화된 계정입니다. 고객지원팀에 문의해주세요.'
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // JWT 토큰 생성
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name
    };

    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'fieldlog-api'
      }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'fieldlog-api'
      }
    );

    // 세션 정보 저장 (선택사항)
    await query(
      `INSERT INTO fieldlog.user_session (user_id, refresh_token, device_info, ip_address, expires_at, created_at, last_used_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days', NOW(), NOW())`,
      [
        user.id,
        refreshToken,
        JSON.stringify({ userAgent: req.get('User-Agent') }),
        req.ip || req.connection.remoteAddress
      ]
    );

    console.log('✅ 로그인 성공:', {
      userId: user.id,
      email: user.email,
      name: user.name
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        access_token: accessToken,
        refresh_token: refreshToken
      },
      message: '로그인 성공'
    });

  } catch (error) {
    console.error('❌ 로그인 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그인 중 오류가 발생했습니다.'
    });
  }
});

// 이메일 중복 확인 API
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '이메일을 입력해주세요.'
      });
    }

    const result = await query(
      'SELECT id FROM fieldlog.user WHERE email = $1',
      [email.toLowerCase()]
    );

    const available = result.rows.length === 0;

    res.json({
      success: true,
      data: { available },
      message: available ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'
    });

  } catch (error) {
    console.error('❌ 이메일 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '이메일 확인 중 오류가 발생했습니다.'
    });
  }
});

// 비밀번호 재설정 요청 API
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: '이메일을 입력해주세요.'
      });
    }

    // 사용자 존재 확인
    const result = await query(
      'SELECT id, name, email FROM fieldlog.user WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    const user = result.rows[0];

    // 보안을 위해 사용자가 없어도 성공 응답 (이메일 존재 여부 노출 방지)
    if (!user) {
      console.log('⚠️ 존재하지 않는 이메일로 비밀번호 재설정 요청:', email);
      return res.json({
        success: true,
        message: '이메일이 등록되어 있다면 비밀번호 재설정 안내가 발송되었습니다.'
      });
    }

    // 6자리 숫자 토큰 생성
    const resetToken = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // 토큰 저장
    resetTokens.set(email.toLowerCase(), {
      token: resetToken,
      expiresAt: expiresAt,
      used: false,
      userId: user.id
    });

    // 이메일 발송
    const emailSent = await sendPasswordResetEmail(user.email, user.name, resetToken);

    if (!emailSent) {
      console.error('❌ 이메일 발송 실패, 하지만 개발 모드에서는 토큰을 반환합니다');
    }

    console.log('✅ 비밀번호 재설정 토큰 생성:', {
      email: user.email,
      token: resetToken,
      expiresAt: expiresAt
    });

    res.json({
      success: true,
      message: '이메일로 비밀번호 재설정 안내가 발송되었습니다.',
      // 개발 환경에서만 토큰 반환 (프로덕션에서는 제거)
      ...(process.env.NODE_ENV === 'development' && { dev_token: resetToken })
    });

  } catch (error) {
    console.error('❌ 비밀번호 재설정 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: '비밀번호 재설정 요청 중 오류가 발생했습니다.'
    });
  }
});

// 토큰 확인 API
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        error: '이메일과 토큰을 입력해주세요.'
      });
    }

    const resetData = resetTokens.get(email.toLowerCase());

    if (!resetData) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    if (resetData.used) {
      return res.status(400).json({
        success: false,
        error: '이미 사용된 토큰입니다.'
      });
    }

    if (new Date() > resetData.expiresAt) {
      resetTokens.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        error: '토큰이 만료되었습니다. 다시 요청해주세요.'
      });
    }

    if (resetData.token !== token) {
      return res.status(400).json({
        success: false,
        error: '토큰이 일치하지 않습니다.'
      });
    }

    res.json({
      success: true,
      message: '토큰이 확인되었습니다.'
    });

  } catch (error) {
    console.error('❌ 토큰 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '토큰 확인 중 오류가 발생했습니다.'
    });
  }
});

// 비밀번호 재설정 API
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: '모든 필드를 입력해주세요.'
      });
    }

    // 비밀번호 강도 검증
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: '비밀번호는 6자 이상이어야 합니다.'
      });
    }

    const resetData = resetTokens.get(email.toLowerCase());

    if (!resetData) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    if (resetData.used) {
      return res.status(400).json({
        success: false,
        error: '이미 사용된 토큰입니다.'
      });
    }

    if (new Date() > resetData.expiresAt) {
      resetTokens.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        error: '토큰이 만료되었습니다. 다시 요청해주세요.'
      });
    }

    if (resetData.token !== token) {
      return res.status(400).json({
        success: false,
        error: '토큰이 일치하지 않습니다.'
      });
    }

    // 비밀번호 해싱
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // 비밀번호 업데이트
    const result = await query(
      `UPDATE fieldlog.user 
       SET password_hash = $1, updated_at = NOW()
       WHERE email = $2 AND is_active = true
       RETURNING id, name, email`,
      [passwordHash, email.toLowerCase()]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다.'
      });
    }

    // 토큰 사용 처리
    resetData.used = true;
    
    // 일정 시간 후 토큰 삭제 (재사용 방지)
    setTimeout(() => {
      resetTokens.delete(email.toLowerCase());
    }, 60000); // 1분 후 삭제

    // 비밀번호 변경 완료 이메일 발송
    await sendPasswordResetConfirmationEmail(user.email, user.name);

    console.log('✅ 비밀번호 재설정 완료:', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('❌ 비밀번호 재설정 오류:', error);
    res.status(500).json({
      success: false,
      error: '비밀번호 재설정 중 오류가 발생했습니다.'
    });
  }
});

// 만료된 토큰 정리 (주기적으로 실행)
setInterval(() => {
  const now = new Date();
  for (const [email, data] of resetTokens.entries()) {
    if (now > data.expiresAt || data.used) {
      resetTokens.delete(email);
    }
  }
}, 5 * 60 * 1000); // 5분마다 실행

module.exports = router;
