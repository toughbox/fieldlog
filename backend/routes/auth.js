const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, transaction } = require('../config/database');

const router = express.Router();

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

module.exports = router;
