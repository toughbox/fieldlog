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

// 현장 기록 목록 조회 API
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      field_id, 
      status, 
      priority, 
      search, 
      page = 1, 
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'DESC' 
    } = req.query;

    // 기본 쿼리
    let whereConditions = ['fr.user_id = $1', 'fr.is_deleted = false'];
    let queryParams = [userId];
    let paramIndex = 2;

    // 필터 조건 추가
    if (field_id) {
      whereConditions.push(`fr.field_id = $${paramIndex++}`);
      queryParams.push(parseInt(field_id));
    }

    if (status) {
      whereConditions.push(`fr.status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (priority) {
      whereConditions.push(`fr.priority = $${paramIndex++}`);
      queryParams.push(parseInt(priority));
    }

    if (search) {
      whereConditions.push(`(fr.title ILIKE $${paramIndex} OR fr.description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // 정렬 및 페이징
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const validSortColumns = ['created_at', 'updated_at', 'title', 'status', 'priority', 'due_date'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = validSortOrders.includes(sort_order?.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM fieldlog.field_record fr
      LEFT JOIN fieldlog.field f ON fr.field_id = f.id
      WHERE ${whereConditions.join(' AND ')}
    `;

    const dataQuery = `
      SELECT fr.id, fr.user_id, fr.field_id, fr.title, fr.description, 
             fr.status, fr.priority, fr.due_date, fr.completed_at,
             fr.custom_data, fr.attachment, fr.location, fr.tags,
             fr.created_at, fr.updated_at,
             f.name as field_name, f.color as field_color, f.icon as field_icon
      FROM fieldlog.field_record fr
      LEFT JOIN fieldlog.field f ON fr.field_id = f.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY fr.${sortColumn} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    queryParams.push(parseInt(limit), offset);

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, queryParams.slice(0, -2)),
      query(dataQuery, queryParams)
    ]);

    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    console.log(`✅ 현장 기록 목록 조회 성공 (사용자 ID: ${userId}):`, dataResult.rows.length, '개');

    res.json({
      success: true,
      data: {
        records: dataResult.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: totalRecords,
          limit: parseInt(limit)
        }
      },
      message: '현장 기록 목록을 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 기록 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 기록 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 현장 기록 상세 조회 API
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: '올바른 기록 ID를 입력해주세요.'
      });
    }

    const result = await query(
      `SELECT fr.id, fr.user_id, fr.field_id, fr.title, fr.description, 
              fr.status, fr.priority, fr.due_date, fr.completed_at,
              fr.custom_data, fr.attachment, fr.location, fr.tags,
              fr.created_at, fr.updated_at,
              f.name as field_name, f.color as field_color, f.icon as field_icon,
              f.field_schema
       FROM fieldlog.field_record fr
       LEFT JOIN fieldlog.field f ON fr.field_id = f.id
       WHERE fr.id = $1 AND fr.user_id = $2 AND fr.is_deleted = false`,
      [recordId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '현장 기록을 찾을 수 없습니다.'
      });
    }

    console.log(`✅ 현장 기록 상세 조회 성공 (ID: ${recordId})`);

    res.json({
      success: true,
      data: result.rows[0],
      message: '현장 기록을 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 기록 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 기록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 현장 기록 생성 API
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      field_id, 
      title, 
      description, 
      status = 'pending', 
      priority = 1, 
      due_date,
      custom_data = {},
      attachment = [],
      location,
      tags = []
    } = req.body;

    // 필수 필드 검증
    if (!field_id || !title) {
      return res.status(400).json({
        success: false,
        error: '현장과 제목은 필수 입력 항목입니다.'
      });
    }

    // 현장 존재 및 권한 확인
    const fieldCheck = await query(
      'SELECT id, name FROM fieldlog.field WHERE id = $1 AND user_id = $2 AND is_active = true',
      [field_id, userId]
    );

    if (fieldCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '해당 현장을 찾을 수 없습니다.'
      });
    }

    // 상태 값 검증
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: '올바른 상태값을 입력해주세요. (pending, in_progress, completed, cancelled)'
      });
    }

    // 우선순위 검증
    if (priority < 1 || priority > 5) {
      return res.status(400).json({
        success: false,
        error: '우선순위는 1(낮음)부터 5(높음)까지 입력 가능합니다.'
      });
    }

    // 마감일 검증
    let parsedDueDate = null;
    if (due_date) {
      parsedDueDate = new Date(due_date);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: '올바른 마감일 형식을 입력해주세요.'
        });
      }
    }

    // 완료일 설정 (상태가 completed인 경우)
    const completedAt = status === 'completed' ? new Date() : null;

    // 현장 기록 생성
    const result = await query(
      `INSERT INTO fieldlog.field_record 
       (user_id, field_id, title, description, status, priority, due_date, completed_at,
        custom_data, attachment, location, tags, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING id, user_id, field_id, title, description, status, priority, 
                 due_date, completed_at, custom_data, attachment, location, tags,
                 created_at, updated_at`,
      [
        userId,
        field_id,
        title.trim(),
        description?.trim() || null,
        status,
        priority,
        parsedDueDate,
        completedAt,
        JSON.stringify(custom_data),
        JSON.stringify(attachment),
        location ? JSON.stringify(location) : null,
        tags
      ]
    );

    const newRecord = result.rows[0];

    console.log('✅ 새 현장 기록 생성 성공:', {
      id: newRecord.id,
      title: newRecord.title,
      field_id: field_id,
      userId: userId
    });

    res.status(201).json({
      success: true,
      data: {
        ...newRecord,
        field_name: fieldCheck.rows[0].name
      },
      message: '현장 기록이 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 기록 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 기록 생성 중 오류가 발생했습니다.'
    });
  }
});

// 현장 기록 수정 API
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const userId = req.user.userId;
    const { 
      field_id, 
      title, 
      description, 
      status, 
      priority, 
      due_date,
      custom_data,
      attachment,
      location,
      tags
    } = req.body;

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: '올바른 기록 ID를 입력해주세요.'
      });
    }

    // 기록 존재 확인
    const existingRecord = await query(
      'SELECT id, status FROM fieldlog.field_record WHERE id = $1 AND user_id = $2 AND is_deleted = false',
      [recordId, userId]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '현장 기록을 찾을 수 없습니다.'
      });
    }

    // 현장 ID가 변경되는 경우 권한 확인
    if (field_id) {
      const fieldCheck = await query(
        'SELECT id FROM fieldlog.field WHERE id = $1 AND user_id = $2 AND is_active = true',
        [field_id, userId]
      );

      if (fieldCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: '해당 현장을 찾을 수 없습니다.'
        });
      }
    }

    // 상태 값 검증
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: '올바른 상태값을 입력해주세요. (pending, in_progress, completed, cancelled)'
        });
      }
    }

    // 우선순위 검증
    if (priority !== undefined && (priority < 1 || priority > 5)) {
      return res.status(400).json({
        success: false,
        error: '우선순위는 1(낮음)부터 5(높음)까지 입력 가능합니다.'
      });
    }

    // 마감일 검증
    let parsedDueDate = undefined;
    if (due_date !== undefined) {
      if (due_date === null) {
        parsedDueDate = null;
      } else {
        parsedDueDate = new Date(due_date);
        if (isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({
            success: false,
            error: '올바른 마감일 형식을 입력해주세요.'
          });
        }
      }
    }

    // 업데이트할 필드들 동적 구성
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (field_id !== undefined) {
      updateFields.push(`field_id = $${paramIndex++}`);
      updateValues.push(field_id);
    }
    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(title.trim());
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description?.trim() || null);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(status);
      
      // 상태가 완료로 변경되는 경우 완료일 설정
      if (status === 'completed' && existingRecord.rows[0].status !== 'completed') {
        updateFields.push(`completed_at = NOW()`);
      } else if (status !== 'completed') {
        updateFields.push(`completed_at = NULL`);
      }
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramIndex++}`);
      updateValues.push(priority);
    }
    if (parsedDueDate !== undefined) {
      updateFields.push(`due_date = $${paramIndex++}`);
      updateValues.push(parsedDueDate);
    }
    if (custom_data !== undefined) {
      updateFields.push(`custom_data = $${paramIndex++}`);
      updateValues.push(JSON.stringify(custom_data));
    }
    if (attachment !== undefined) {
      updateFields.push(`attachment = $${paramIndex++}`);
      updateValues.push(JSON.stringify(attachment));
    }
    if (location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      updateValues.push(location ? JSON.stringify(location) : null);
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      updateValues.push(tags);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: '수정할 내용이 없습니다.'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(recordId, userId);

    const updateQuery = `
      UPDATE fieldlog.field_record 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++} AND is_deleted = false
      RETURNING id, user_id, field_id, title, description, status, priority, 
                due_date, completed_at, custom_data, attachment, location, tags,
                created_at, updated_at
    `;

    const result = await query(updateQuery, updateValues);
    const updatedRecord = result.rows[0];

    console.log('✅ 현장 기록 수정 성공:', {
      id: updatedRecord.id,
      title: updatedRecord.title,
      userId: userId
    });

    res.json({
      success: true,
      data: updatedRecord,
      message: '현장 기록이 성공적으로 수정되었습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 기록 수정 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 기록 수정 중 오류가 발생했습니다.'
    });
  }
});

// 현장 기록 삭제 API (소프트 삭제)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const recordId = parseInt(req.params.id);
    const userId = req.user.userId;

    if (isNaN(recordId)) {
      return res.status(400).json({
        success: false,
        error: '올바른 기록 ID를 입력해주세요.'
      });
    }

    // 기록 존재 확인
    const existingRecord = await query(
      'SELECT id, title FROM fieldlog.field_record WHERE id = $1 AND user_id = $2 AND is_deleted = false',
      [recordId, userId]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '현장 기록을 찾을 수 없습니다.'
      });
    }

    // 소프트 삭제 (is_deleted = true)
    await query(
      'UPDATE fieldlog.field_record SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND user_id = $2',
      [recordId, userId]
    );

    console.log('✅ 현장 기록 삭제 성공:', {
      id: recordId,
      title: existingRecord.rows[0].title,
      userId: userId
    });

    res.json({
      success: true,
      message: '현장 기록이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 기록 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 기록 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 현장 기록 통계 조회 API
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { field_id } = req.query;

    let whereCondition = 'user_id = $1 AND is_deleted = false';
    let queryParams = [userId];

    if (field_id) {
      whereCondition += ' AND field_id = $2';
      queryParams.push(parseInt(field_id));
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN due_date < NOW() AND status NOT IN ('completed', 'cancelled') THEN 1 END) as overdue_count,
        COUNT(CASE WHEN due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours' AND status NOT IN ('completed', 'cancelled') THEN 1 END) as due_soon_count,
        AVG(CASE WHEN priority THEN priority END) as avg_priority
      FROM fieldlog.field_record 
      WHERE ${whereCondition}
    `;

    const result = await query(statsQuery, queryParams);
    const stats = result.rows[0];

    // 숫자 형변환
    Object.keys(stats).forEach(key => {
      if (key === 'avg_priority') {
        stats[key] = stats[key] ? parseFloat(stats[key]).toFixed(1) : 0;
      } else {
        stats[key] = parseInt(stats[key]) || 0;
      }
    });

    console.log(`✅ 현장 기록 통계 조회 성공 (사용자 ID: ${userId})`);

    res.json({
      success: true,
      data: stats,
      message: '현장 기록 통계를 성공적으로 조회했습니다.'
    });

  } catch (error) {
    console.error('❌ 현장 기록 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '현장 기록 통계 조회 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
