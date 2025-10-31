const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');
const { sendPasswordResetEmail, sendPasswordResetConfirmationEmail, sendEmailVerification } = require('../services/emailService');

const router = express.Router();

// 비밀번호 재설정 토큰 저장소 (메모리) - 프로덕션에서는 Redis나 DB 사용 권장
const resetTokens = new Map(); // { email: { token, expiresAt, used } }

// 이메일 검증 토큰 저장소 (메모리) - 프로덕션에서는 Redis나 DB 사용 권장
const verificationTokens = new Map(); // { email: { token, expiresAt, used, name, password } }

// 이메일 검증 요청 API (회원가입 1단계)
router.post('/request-email-verification', async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

    // 6자리 숫자 토큰 생성
    const verificationToken = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // 비밀번호 해싱
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 토큰 저장 (회원가입 정보 함께 저장)
    verificationTokens.set(email.toLowerCase(), {
      token: verificationToken,
      expiresAt: expiresAt,
      used: false,
      name: name.trim(),
      passwordHash: passwordHash
    });

    // 이메일 발송
    const emailSent = await sendEmailVerification(email, name, verificationToken);

    if (!emailSent) {
      console.error('❌ 이메일 발송 실패, 하지만 개발 모드에서는 토큰을 반환합니다');
    }

    console.log('✅ 이메일 검증 토큰 생성:', {
      email: email,
      token: verificationToken,
      expiresAt: expiresAt
    });

    res.json({
      success: true,
      message: '이메일로 인증 코드가 발송되었습니다.',
      // 개발 환경에서만 토큰 반환 (프로덕션에서는 제거)
      ...(process.env.NODE_ENV === 'development' && { dev_token: verificationToken })
    });

  } catch (error) {
    console.error('❌ 이메일 검증 요청 오류:', error);
    res.status(500).json({
      success: false,
      error: '이메일 검증 요청 중 오류가 발생했습니다.'
    });
  }
});

// 이메일 검증 토큰 확인 및 회원가입 완료 API (회원가입 2단계)
router.post('/verify-email-and-signup', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        error: '이메일과 인증 코드를 입력해주세요.'
      });
    }

    const verificationData = verificationTokens.get(email.toLowerCase());

    if (!verificationData) {
      return res.status(400).json({
        success: false,
        error: '유효하지 않은 인증 코드입니다.'
      });
    }

    if (verificationData.used) {
      return res.status(400).json({
        success: false,
        error: '이미 사용된 인증 코드입니다.'
      });
    }

    if (new Date() > verificationData.expiresAt) {
      verificationTokens.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        error: '인증 코드가 만료되었습니다. 다시 요청해주세요.'
      });
    }

    if (verificationData.token !== token) {
      return res.status(400).json({
        success: false,
        error: '인증 코드가 일치하지 않습니다.'
      });
    }

    // 이메일 검증 성공 - 회원가입 진행
    const result = await query(
      `INSERT INTO fieldlog.user (name, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, name, email, created_at`,
      [verificationData.name, email.toLowerCase(), verificationData.passwordHash]
    );

    const newUser = result.rows[0];

    // 토큰 사용 처리
    verificationData.used = true;
    
    // 일정 시간 후 토큰 삭제 (재사용 방지)
    setTimeout(() => {
      verificationTokens.delete(email.toLowerCase());
    }, 60000); // 1분 후 삭제

    console.log('✅ 이메일 검증 및 회원가입 성공:', {
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
        created_at: newUser.created_at
      },
      message: '이메일 인증이 완료되어 회원가입이 완료되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이메일 검증 및 회원가입 오류:', error);
    
    // 이메일 중복 오류 처리
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: '이미 사용 중인 이메일입니다.'
      });
    }

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

    // 같은 기기의 이전 세션 무효화 (선택적)
    const userAgent = req.get('User-Agent') || 'unknown';
    
    console.log('🔄 세션 업데이트 시작:', {
      userId: user.id,
      userAgent: userAgent
    });
    
    try {
      const updateResult = await query(
        `UPDATE fieldlog.user_session 
         SET is_active = false 
         WHERE user_id = $1 AND device_info->>'userAgent' = $2 AND is_active = true`,
        [user.id, userAgent]
      );
      console.log('✅ 이전 세션 비활성화:', updateResult.rowCount, '개');
    } catch (updateError) {
      console.error('⚠️ 이전 세션 비활성화 실패 (계속 진행):', updateError.message);
      // 이전 세션 비활성화 실패해도 로그인은 계속 진행
    }

    // IP 주소 정리 (IPv6 ::1을 null로, 유효하지 않은 값은 null로)
    let ipAddress = req.ip || req.connection.remoteAddress || null;
    if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
      ipAddress = '127.0.0.1'; // localhost를 IPv4로 정규화
    }
    // IPv6를 IPv4로 변환 (::ffff: 접두사 제거)
    if (ipAddress && ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.substring(7);
    }
    
    console.log('📝 새 세션 저장 시도:', {
      userId: user.id,
      ipAddress: ipAddress,
      deviceInfo: { userAgent }
    });

    // 새 세션 정보 저장
    try {
      const insertResult = await query(
        `INSERT INTO fieldlog.user_session (user_id, refresh_token, device_info, ip_address, expires_at, created_at, last_used_at)
         VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days', NOW(), NOW())
         RETURNING id`,
        [
          user.id,
          refreshToken,
          JSON.stringify({ userAgent }),
          ipAddress
        ]
      );
      console.log('✅ 새 세션 저장 완료:', insertResult.rows[0].id);
    } catch (insertError) {
      console.error('❌ 세션 저장 실패:', {
        error: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
        userId: user.id,
        ipAddress: ipAddress
      });
      // 세션 저장 실패해도 로그인은 성공으로 처리 (토큰은 발급됨)
      // 프로덕션에서는 이 부분을 어떻게 처리할지 결정 필요
    }

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

// 로그아웃 API
router.post('/logout', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'refresh_token이 필요합니다.'
      });
    }
    
    // 세션을 비활성화 (삭제하지 않고 is_active = false로 설정)
    const result = await query(
      `UPDATE fieldlog.user_session 
       SET is_active = false, last_used_at = NOW()
       WHERE refresh_token = $1 AND is_active = true
       RETURNING user_id`,
      [refresh_token]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ 로그아웃 성공:', {
        userId: result.rows[0].user_id
      });
    }
    
    res.json({
      success: true,
      message: '로그아웃 되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 로그아웃 오류:', error);
    res.status(500).json({
      success: false,
      error: '로그아웃 중 오류가 발생했습니다.'
    });
  }
});

// 토큰 갱신 API (refresh token으로 새 access token 발급)
router.post('/refresh-token', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'refresh_token이 필요합니다.'
      });
    }
    
    // refresh token 검증
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않거나 만료된 토큰입니다.'
      });
    }
    
    // 세션 확인 (활성화 상태 및 만료 시간 체크)
    const sessionResult = await query(
      `SELECT us.id, us.user_id, us.expires_at, u.name, u.email, u.phone, u.is_active
       FROM fieldlog.user_session us
       JOIN fieldlog.user u ON us.user_id = u.id
       WHERE us.refresh_token = $1 AND us.is_active = true`,
      [refresh_token]
    );
    
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않거나 만료된 세션입니다.'
      });
    }
    
    const session = sessionResult.rows[0];
    
    // 세션 만료 확인
    if (new Date() > new Date(session.expires_at)) {
      await query(
        'UPDATE fieldlog.user_session SET is_active = false WHERE id = $1',
        [session.id]
      );
      return res.status(401).json({
        success: false,
        error: '세션이 만료되었습니다. 다시 로그인해주세요.'
      });
    }
    
    // 사용자 계정 활성화 상태 확인
    if (!session.is_active) {
      return res.status(401).json({
        success: false,
        error: '비활성화된 계정입니다.'
      });
    }
    
    // 새 access token 생성
    const tokenPayload = {
      userId: session.user_id,
      email: session.email,
      name: session.name
    };
    
    const accessToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'fieldlog-api'
      }
    );
    
    // 세션 마지막 사용 시간 업데이트
    await query(
      'UPDATE fieldlog.user_session SET last_used_at = NOW() WHERE id = $1',
      [session.id]
    );
    
    console.log('✅ 토큰 갱신 성공:', {
      userId: session.user_id,
      email: session.email
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: session.user_id,
          name: session.name,
          email: session.email,
          phone: session.phone
        },
        access_token: accessToken,
        refresh_token: refresh_token // 기존 refresh_token 재사용
      },
      message: '토큰이 갱신되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 토큰 갱신 오류:', error);
    res.status(500).json({
      success: false,
      error: '토큰 갱신 중 오류가 발생했습니다.'
    });
  }
});

// 모든 세션 조회 API (현재 사용자의 활성 세션 목록)
router.get('/sessions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }
    
    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }
    
    const result = await query(
      `SELECT id, device_info, ip_address, created_at, last_used_at, expires_at
       FROM fieldlog.user_session
       WHERE user_id = $1 AND is_active = true
       ORDER BY last_used_at DESC`,
      [decoded.userId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('❌ 세션 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '세션 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 세션 로그아웃 API (다른 기기에서 로그아웃)
router.post('/logout-session', async (req, res) => {
  try {
    const { session_id } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        error: 'session_id가 필요합니다.'
      });
    }
    
    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }
    
    // 자신의 세션만 로그아웃 가능
    const result = await query(
      `UPDATE fieldlog.user_session 
       SET is_active = false, last_used_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_active = true
       RETURNING id`,
      [session_id, decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '세션을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      message: '세션이 로그아웃되었습니다.'
    });
    
  } catch (error) {
    console.error('❌ 세션 로그아웃 오류:', error);
    res.status(500).json({
      success: false,
      error: '세션 로그아웃 중 오류가 발생했습니다.'
    });
  }
});

// 만료된 토큰 정리 (주기적으로 실행)
setInterval(() => {
  const now = new Date();
  
  // 비밀번호 재설정 토큰 정리
  for (const [email, data] of resetTokens.entries()) {
    if (now > data.expiresAt || data.used) {
      resetTokens.delete(email);
    }
  }
  
  // 이메일 검증 토큰 정리
  for (const [email, data] of verificationTokens.entries()) {
    if (now > data.expiresAt || data.used) {
      verificationTokens.delete(email);
    }
  }
}, 5 * 60 * 1000); // 5분마다 실행

// 오래된 비활성 세션 정리 (주기적으로 실행)
// 30일 이상 된 비활성 세션 삭제
setInterval(async () => {
  try {
    const result = await query(
      `DELETE FROM fieldlog.user_session 
       WHERE is_active = false 
         AND last_used_at < NOW() - INTERVAL '30 days'
       RETURNING id`
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ ${result.rows.length}개의 오래된 비활성 세션 정리 완료`);
    }
  } catch (error) {
    console.error('❌ 세션 정리 오류:', error);
  }
}, 24 * 60 * 60 * 1000); // 24시간마다 실행

// 만료된 활성 세션 비활성화 (주기적으로 실행)
setInterval(async () => {
  try {
    const result = await query(
      `UPDATE fieldlog.user_session 
       SET is_active = false 
       WHERE is_active = true 
         AND expires_at < NOW()
       RETURNING id`
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ ${result.rows.length}개의 만료된 세션 비활성화 완료`);
    }
  } catch (error) {
    console.error('❌ 만료 세션 비활성화 오류:', error);
  }
}, 60 * 60 * 1000); // 1시간마다 실행

// 회원 탈퇴 API
router.delete('/delete-account', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '인증 토큰이 필요합니다.'
      });
    }
    
    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }
    
    const userId = decoded.userId;
    
    console.log('🗑️ 회원 탈퇴 시작:', {
      userId: userId,
      email: decoded.email
    });
    
    // 트랜잭션으로 모든 데이터 삭제
    try {
      await transaction(async (client) => {
        // 1. 현장 기록 삭제
        const fieldRecordResult = await client.query(
          'DELETE FROM fieldlog.field_record WHERE user_id = $1',
          [userId]
        );
        console.log('✅ field_record 삭제:', fieldRecordResult.rowCount, '개');
        
        // 2. 현장 삭제
        const fieldResult = await client.query(
          'DELETE FROM fieldlog.field WHERE user_id = $1',
          [userId]
        );
        console.log('✅ field 삭제:', fieldResult.rowCount, '개');
        
        // 3. 푸시 토큰 삭제
        const tokenResult = await client.query(
          'DELETE FROM fieldlog.push_tokens WHERE user_id = $1',
          [userId]
        );
        console.log('✅ push_tokens 삭제:', tokenResult.rowCount, '개');
        
        // 4. 세션 삭제
        const sessionResult = await client.query(
          'DELETE FROM fieldlog.user_session WHERE user_id = $1',
          [userId]
        );
        console.log('✅ user_session 삭제:', sessionResult.rowCount, '개');
        
        // 5. 사용자 삭제
        const userResult = await client.query(
          'DELETE FROM fieldlog.user WHERE id = $1 RETURNING email',
          [userId]
        );
        
        if (userResult.rows.length === 0) {
          throw new Error('사용자를 찾을 수 없습니다.');
        }
        
        console.log('✅ 회원 탈퇴 완료:', {
          userId: userId,
          email: userResult.rows[0].email
        });
      });
      
      res.json({
        success: true,
        message: '회원 탈퇴가 완료되었습니다.'
      });
      
    } catch (transactionError) {
      console.error('❌ 회원 탈퇴 트랜잭션 오류:', transactionError);
      throw transactionError;
    }
    
  } catch (error) {
    console.error('❌ 회원 탈퇴 오류:', error);
    res.status(500).json({
      success: false,
      error: '회원 탈퇴 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
