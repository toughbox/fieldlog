const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
const recordRoutes = require('./routes/records');
const uploadRoutes = require('./routes/upload');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3030;

// 보안 미들웨어
app.use(helmet());

// CORS 설정
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  credentials: true
}));

// Rate Limiting (개발 환경에서는 더 관대하게 설정)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10분
  max: process.env.NODE_ENV === 'production' ? 200 : 1000, // 개발: 1000회, 프로덕션: 200회
  message: {
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use('/api/', limiter);

// JSON 파싱
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 라우트 설정
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/upload', uploadRoutes);

// 기본 헬스체크 엔드포인트
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FieldLog API 서버가 정상 작동 중입니다.',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 에러 처리
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '요청하신 API 엔드포인트를 찾을 수 없습니다.'
  });
});

// 전역 에러 처리
app.use((error, req, res, next) => {
  console.error('🚨 서버 오류:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? error.message 
      : '서버 내부 오류가 발생했습니다.'
  });
});

// 서버 시작
async function startServer() {
  try {
    // 데이터베이스 연결
    await connectDB();
    console.log('✅ 데이터베이스 연결 성공');
    
    app.listen(PORT, () => {
      console.log(`🚀 FieldLog API 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`🏗️  Fields API: http://localhost:${PORT}/api/fields`);
      console.log(`📝 Records API: http://localhost:${PORT}/api/records`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT 신호를 받았습니다. 서버를 종료합니다...');
  process.exit(0);
});
