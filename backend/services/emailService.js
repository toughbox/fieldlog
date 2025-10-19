const nodemailer = require('nodemailer');

// 이메일 전송을 위한 transporter 생성
const createTransporter = () => {
  // 개발 환경에서는 Ethereal Email (테스트용 이메일 서비스) 사용
  // 프로덕션에서는 실제 SMTP 설정 사용
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    // Gmail 사용 시
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Gmail 앱 비밀번호
      },
    });
  } else if (process.env.SMTP_HOST) {
    // 커스텀 SMTP 서버 사용
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // 개발 환경: 콘솔에 이메일 내용 출력
    console.log('⚠️ 이메일 설정이 없습니다. 개발 모드로 실행됩니다.');
    return null;
  }
};

/**
 * 비밀번호 재설정 이메일 발송
 * @param {string} email - 수신자 이메일
 * @param {string} userName - 사용자 이름
 * @param {string} resetToken - 재설정 토큰
 * @returns {Promise<boolean>} 발송 성공 여부
 */
const sendPasswordResetEmail = async (email, userName, resetToken) => {
  try {
    const transporter = createTransporter();
    
    // 이메일 설정이 없는 경우 (개발 모드)
    if (!transporter) {
      console.log('📧 [개발 모드] 비밀번호 재설정 이메일:');
      console.log('수신자:', email);
      console.log('이름:', userName);
      console.log('재설정 토큰:', resetToken);
      console.log('토큰은 10분간 유효합니다.');
      return true;
    }

    const mailOptions = {
      from: `"FieldLog" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'FieldLog 비밀번호 재설정',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .token-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb; border-radius: 5px; }
            .token { font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 3px; text-align: center; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 비밀번호 재설정</h1>
            </div>
            <div class="content">
              <p>안녕하세요, <strong>${userName}</strong>님!</p>
              <p>FieldLog 계정의 비밀번호 재설정을 요청하셨습니다.</p>
              
              <div class="token-box">
                <p style="margin: 0 0 10px 0; text-align: center; color: #6b7280;">재설정 토큰</p>
                <div class="token">${resetToken}</div>
              </div>

              <p>위 토큰을 앱에 입력하여 비밀번호를 재설정하세요.</p>

              <div class="warning">
                <strong>⚠️ 중요:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>이 토큰은 <strong>10분간만 유효</strong>합니다.</li>
                  <li>토큰은 한 번만 사용할 수 있습니다.</li>
                  <li>본인이 요청하지 않았다면 이 이메일을 무시하세요.</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">감사합니다.<br><strong>FieldLog 팀</strong></p>
            </div>
            <div class="footer">
              <p>본 메일은 발신 전용입니다. 문의사항은 고객지원팀으로 연락주세요.</p>
              <p>&copy; 2024 FieldLog. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
안녕하세요, ${userName}님!

FieldLog 계정의 비밀번호 재설정을 요청하셨습니다.

재설정 토큰: ${resetToken}

위 토큰을 앱에 입력하여 비밀번호를 재설정하세요.

⚠️ 중요:
- 이 토큰은 10분간만 유효합니다.
- 토큰은 한 번만 사용할 수 있습니다.
- 본인이 요청하지 않았다면 이 이메일을 무시하세요.

감사합니다.
FieldLog 팀
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 비밀번호 재설정 이메일 발송 성공:', info.messageId);
    return true;

  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    return false;
  }
};

/**
 * 비밀번호 재설정 완료 알림 이메일 발송
 * @param {string} email - 수신자 이메일
 * @param {string} userName - 사용자 이름
 * @returns {Promise<boolean>} 발송 성공 여부
 */
const sendPasswordResetConfirmationEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('📧 [개발 모드] 비밀번호 재설정 완료 알림:');
      console.log('수신자:', email);
      console.log('이름:', userName);
      return true;
    }

    const mailOptions = {
      from: `"FieldLog" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'FieldLog 비밀번호가 변경되었습니다',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ 비밀번호 변경 완료</h1>
            </div>
            <div class="content">
              <p>안녕하세요, <strong>${userName}</strong>님!</p>
              
              <div class="success-box">
                <p style="margin: 0;"><strong>✅ 비밀번호가 성공적으로 변경되었습니다.</strong></p>
              </div>

              <p>귀하의 FieldLog 계정 비밀번호가 방금 변경되었습니다.</p>
              <p>새 비밀번호로 로그인하실 수 있습니다.</p>

              <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 5px;">
                <strong>⚠️ 본인이 변경하지 않았다면</strong><br>
                즉시 고객지원팀으로 연락하여 계정을 보호하세요.
              </p>

              <p style="margin-top: 30px;">감사합니다.<br><strong>FieldLog 팀</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2024 FieldLog. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
안녕하세요, ${userName}님!

✅ 비밀번호가 성공적으로 변경되었습니다.

귀하의 FieldLog 계정 비밀번호가 방금 변경되었습니다.
새 비밀번호로 로그인하실 수 있습니다.

⚠️ 본인이 변경하지 않았다면 즉시 고객지원팀으로 연락하여 계정을 보호하세요.

감사합니다.
FieldLog 팀
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 비밀번호 변경 완료 이메일 발송 성공:', info.messageId);
    return true;

  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    return false;
  }
};

/**
 * 이메일 검증 메일 발송
 * @param {string} email - 수신자 이메일
 * @param {string} userName - 사용자 이름
 * @param {string} verificationToken - 검증 토큰
 * @returns {Promise<boolean>} 발송 성공 여부
 */
const sendEmailVerification = async (email, userName, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    // 이메일 설정이 없는 경우 (개발 모드)
    if (!transporter) {
      console.log('📧 [개발 모드] 이메일 검증 메일:');
      console.log('수신자:', email);
      console.log('이름:', userName);
      console.log('검증 토큰:', verificationToken);
      console.log('토큰은 10분간 유효합니다.');
      return true;
    }

    const mailOptions = {
      from: `"FieldLog" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'FieldLog 이메일 인증',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .token-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb; border-radius: 5px; }
            .token { font-size: 28px; font-weight: bold; color: #2563eb; letter-spacing: 3px; text-align: center; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✉️ 이메일 인증</h1>
            </div>
            <div class="content">
              <p>안녕하세요, <strong>${userName}</strong>님!</p>
              <p>FieldLog 회원가입을 위한 이메일 인증을 진행해주세요.</p>
              
              <div class="token-box">
                <p style="margin: 0 0 10px 0; text-align: center; color: #6b7280;">인증 코드</p>
                <div class="token">${verificationToken}</div>
              </div>

              <p>위 인증 코드를 앱에 입력하여 이메일 인증을 완료하세요.</p>

              <div class="warning">
                <strong>⚠️ 중요:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>이 코드는 <strong>10분간만 유효</strong>합니다.</li>
                  <li>코드는 한 번만 사용할 수 있습니다.</li>
                  <li>본인이 요청하지 않았다면 이 이메일을 무시하세요.</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">감사합니다.<br><strong>FieldLog 팀</strong></p>
            </div>
            <div class="footer">
              <p>본 메일은 발신 전용입니다. 문의사항은 고객지원팀으로 연락주세요.</p>
              <p>&copy; 2024 FieldLog. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
안녕하세요, ${userName}님!

FieldLog 회원가입을 위한 이메일 인증을 진행해주세요.

인증 코드: ${verificationToken}

위 인증 코드를 앱에 입력하여 이메일 인증을 완료하세요.

⚠️ 중요:
- 이 코드는 10분간만 유효합니다.
- 코드는 한 번만 사용할 수 있습니다.
- 본인이 요청하지 않았다면 이 이메일을 무시하세요.

감사합니다.
FieldLog 팀
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 이메일 검증 메일 발송 성공:', info.messageId);
    return true;

  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendEmailVerification,
};

