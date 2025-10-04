const express = require('express');
const multer = require('multer');
const { Client } = require('minio');
const path = require('path');
const jwt = require('jsonwebtoken');
const router = express.Router();
// 인증 미들웨어 (records.js에서 가져옴)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: '접근 토큰이 필요합니다.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      });
    }

    req.user = user;
    next();
  });
};

// MinIO 클라이언트 설정
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'toughbox.iptime.org',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true' || false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'tough',
  secretKey: process.env.MINIO_SECRET_KEY || '12345678'
});

// Multer 설정 (메모리 저장)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 버킷 존재 확인 및 생성
const ensureBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists('fieldlog');
    if (!bucketExists) {
      await minioClient.makeBucket('fieldlog', 'us-east-1');
      console.log('✅ fieldlog 버킷이 생성되었습니다.');
    }
  } catch (error) {
    console.error('❌ 버킷 확인/생성 오류:', error);
  }
};

// 앱 시작시 버킷 확인
ensureBucket();

// 이미지 업로드
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '파일이 없습니다.'
      });
    }

    const { recordId } = req.body;
    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: '기록 ID가 필요합니다.'
      });
    }

    // 파일명 생성 (중복 방지)
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${recordId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const objectName = `images/${fileName}`;

    // MinIO에 업로드
    await minioClient.putObject('fieldlog', objectName, req.file.buffer, req.file.size, {
      'Content-Type': req.file.mimetype
    });

    // 이미지 URL 생성 (백엔드 API를 통해 서빙)
    const imageUrl = `/api/upload/image/${fileName}`;

    res.json({
      success: true,
      data: {
        fileName: fileName,
        url: imageUrl,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('❌ 이미지 업로드 오류:', error);
    res.status(500).json({
      success: false,
      error: '이미지 업로드 중 오류가 발생했습니다.'
    });
  }
});

// 이미지 조회
router.get('/image/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const objectName = `images/${fileName}`;

    // MinIO에서 이미지 스트림 가져오기
    const dataStream = await minioClient.getObject('fieldlog', objectName);
    
    // 적절한 Content-Type 설정
    const extension = path.extname(fileName).toLowerCase();
    let contentType = 'image/jpeg';
    if (extension === '.png') contentType = 'image/png';
    if (extension === '.gif') contentType = 'image/gif';
    if (extension === '.webp') contentType = 'image/webp';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1년 캐시
    
    dataStream.pipe(res);

  } catch (error) {
    console.error('❌ 이미지 조회 오류:', error);
    res.status(404).json({
      success: false,
      error: '이미지를 찾을 수 없습니다.'
    });
  }
});

// 이미지 삭제
router.delete('/image/:fileName', authenticateToken, async (req, res) => {
  try {
    const { fileName } = req.params;
    const objectName = `images/${fileName}`;

    // MinIO에서 이미지 삭제
    await minioClient.removeObject('fieldlog', objectName);

    res.json({
      success: true,
      message: '이미지가 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ 이미지 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '이미지 삭제 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
