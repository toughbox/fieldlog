const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const router = express.Router();

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: '접근 권한이 없습니다. 로그인이 필요합니다.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
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

// 현장 목록 조회 API
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await query(
      `SELECT id, user_id, name, description, color, icon, field_schema, 
              is_active, sort_order, created_at, updated_at
       FROM fieldlog.field 
       WHERE user_id = $1 AND is_active = true
       ORDER BY sort_order ASC, created_at ASC`,
      [userId]
    );

    console.log(`✅ 현장 목록 조회 성공 (사용자 ID: ${userId}):`, result.rows.length, '개');

    res.json({
      success: true,
      data: result.rows,
      message: '현장 목록을 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 현장 상세 조회 API
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(fieldId)) {
      return res.status(400).json({
        success: false,
        error: '올바른 현장 ID를 입력해주세요.'
      });
    }

    const result = await query(
      `SELECT id, user_id, name, description, color, icon, field_schema, 
              is_active, sort_order, created_at, updated_at
       FROM fieldlog.field 
       WHERE id = $1 AND user_id = $2 AND is_active = true`,
      [fieldId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '현장을 찾을 수 없습니다.'
      });
    }

    console.log(`✅ 현장 상세 조회 성공 (ID: ${fieldId})`);

    res.json({
      success: true,
      data: result.rows[0],
      message: '현장 정보를 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 조회 중 오류가 발생했습니다.'
    });
  }
});

// 현장 생성 API
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, color, icon, field_schema, sort_order } = req.body;

    // 필수 필드 검증
    if (!name || !field_schema) {
      return res.status(400).json({
        success: false,
        error: '현장명과 필드 스키마는 필수 입력 항목입니다.'
      });
    }

    // 현장명 중복 확인
    const existingField = await query(
      'SELECT id FROM fieldlog.field WHERE user_id = $1 AND name = $2 AND is_active = true',
      [userId, name.trim()]
    );

    if (existingField.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: '이미 사용 중인 현장명입니다.'
      });
    }

    // 필드 스키마 검증
    if (!field_schema.fields || !Array.isArray(field_schema.fields)) {
      return res.status(400).json({
        success: false,
        error: '올바른 필드 스키마 형식이 아닙니다.'
      });
    }

    // 현장 생성
    const result = await query(
      `INSERT INTO fieldlog.field (user_id, name, description, color, icon, field_schema, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, user_id, name, description, color, icon, field_schema, is_active, sort_order, created_at, updated_at`,
      [
        userId,
        name.trim(),
        description?.trim() || null,
        color || '#6366F1',
        icon || 'folder',
        JSON.stringify(field_schema),
        sort_order || 0
      ]
    );

    const newField = result.rows[0];

    console.log('✅ 새 현장 생성 성공:', {
      id: newField.id,
      name: newField.name,
      userId: userId
    });

    res.status(201).json({
      success: true,
      data: newField,
      message: '현장이 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 생성 중 오류가 발생했습니다.'
    });
  }
});

// 현장 수정 API
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { name, description, color, icon, field_schema, is_active, sort_order } = req.body;

    if (isNaN(fieldId)) {
      return res.status(400).json({
        success: false,
        error: '올바른 현장 ID를 입력해주세요.'
      });
    }

    // 현장 존재 확인
    const existingField = await query(
      'SELECT id FROM fieldlog.field WHERE id = $1 AND user_id = $2',
      [fieldId, userId]
    );

    if (existingField.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '현장을 찾을 수 없습니다.'
      });
    }

    // 현장명 중복 확인 (자신 제외)
    if (name) {
      const duplicateField = await query(
        'SELECT id FROM fieldlog.field WHERE user_id = $1 AND name = $2 AND id != $3 AND is_active = true',
        [userId, name.trim(), fieldId]
      );

      if (duplicateField.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: '이미 사용 중인 현장명입니다.'
        });
      }
    }

    // 업데이트할 필드들 동적 구성
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name.trim());
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description?.trim() || null);
    }
    if (color !== undefined) {
      updateFields.push(`color = $${paramIndex++}`);
      updateValues.push(color);
    }
    if (icon !== undefined) {
      updateFields.push(`icon = $${paramIndex++}`);
      updateValues.push(icon);
    }
    if (field_schema !== undefined) {
      updateFields.push(`field_schema = $${paramIndex++}`);
      updateValues.push(JSON.stringify(field_schema));
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(is_active);
    }
    if (sort_order !== undefined) {
      updateFields.push(`sort_order = $${paramIndex++}`);
      updateValues.push(sort_order);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: '수정할 내용이 없습니다.'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(fieldId, userId);

    const updateQuery = `
      UPDATE fieldlog.field 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING id, user_id, name, description, color, icon, field_schema, is_active, sort_order, created_at, updated_at
    `;

    const result = await query(updateQuery, updateValues);
    const updatedField = result.rows[0];

    console.log('✅ 현장 수정 성공:', {
      id: updatedField.id,
      name: updatedField.name,
      userId: userId
    });

    res.json({
      success: true,
      data: updatedField,
      message: '현장이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 수정 중 오류가 발생했습니다.'
    });
  }
});

// 현장 삭제 API (소프트 삭제)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const fieldId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(fieldId)) {
      return res.status(400).json({
        success: false,
        error: '올바른 현장 ID를 입력해주세요.'
      });
    }

    // 현장 존재 확인
    const existingField = await query(
      'SELECT id, name FROM fieldlog.field WHERE id = $1 AND user_id = $2 AND is_active = true',
      [fieldId, userId]
    );

    if (existingField.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '현장을 찾을 수 없습니다.'
      });
    }

    // 해당 현장에 연결된 기록이 있는지 확인
    const recordCount = await query(
      'SELECT COUNT(*) as count FROM fieldlog.field_record WHERE field_id = $1 AND is_deleted = false',
      [fieldId]
    );

    const hasRecords = parseInt(recordCount.rows[0].count) > 0;

    if (hasRecords) {
      // 기록이 있으면 소프트 삭제 (is_active = false)
      await query(
        'UPDATE fieldlog.field SET is_active = false, updated_at = NOW() WHERE id = $1 AND user_id = $2',
        [fieldId, userId]
      );

      console.log('✅ 현장 비활성화 성공 (기록 보존):', {
        id: fieldId,
        name: existingField.rows[0].name,
        userId: userId
      });

      res.json({
        success: true,
        message: '현장이 비활성화되었습니다. (연결된 기록은 보존됩니다)'
      });
    } else {
      // 기록이 없으면 완전 삭제
      await query(
        'DELETE FROM fieldlog.field WHERE id = $1 AND user_id = $2',
        [fieldId, userId]
      );

      console.log('✅ 현장 완전 삭제 성공:', {
        id: fieldId,
        name: existingField.rows[0].name,
        userId: userId
      });

      res.json({
        success: true,
        message: '현장이 성공적으로 삭제되었습니다.'
      });
    }

  } catch (error) {
    console.error('❌ 현장 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 삭제 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
