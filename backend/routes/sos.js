const express = require('express');
const router = express.Router();
const db = require('../db');

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fakeSeedVolunteers() {
  return [
    { name: '王秀兰', phone: '138****2234', role: '地区常驻志愿者 · 网格员' },
    { name: '李秋芳', phone: '139****6678', role: '地区常驻志愿者 · 保安' }
  ];
}

function getFakeVolunteerRole(item) {
  if (item.name === '王秀兰') return '地区常驻志愿者 · 网格员';
  if (item.name === '李秋芳') return '地区常驻志愿者 · 保安';
  return item.role || '地区常驻志愿者';
}

function fakePosition(index, requesterPosition) {
  const offsets = [
    { latitude: 0.00029, longitude: 0.00033 },
    { latitude: -0.00027, longitude: -0.00029 }
  ];
  const offset = offsets[index] || { latitude: 0.00018, longitude: -0.0002 };
  return {
    latitude: Number((Number(requesterPosition.latitude) + offset.latitude).toFixed(6)),
    longitude: Number((Number(requesterPosition.longitude) + offset.longitude).toFixed(6))
  };
}

function realPosition(index, requesterPosition) {
  return {
    latitude: Number((Number(requesterPosition.latitude) + 0.00018 + index * 0.00005).toFixed(6)),
    longitude: Number((Number(requesterPosition.longitude) - 0.00022 - index * 0.00004).toFixed(6))
  };
}

function buildMovingStatus(item) {
  if (!item.move_start_at || item.status === '待响应') {
    return {
      status: '待响应',
      progress: 0,
      etaText: '待响应'
    };
  }

  const elapsed = Math.floor((Date.now() - item.move_start_at) / 1000);
  const duration = item.move_duration_sec || 30;
  const progress = Math.min(100, Math.floor((elapsed / duration) * 100));

  if (progress >= 100) {
    return {
      status: '已到达',
      progress: 100,
      etaText: '已到达'
    };
  }

  const left = Math.max(1, duration - elapsed);
  return {
    status: '前往中',
    progress,
    etaText: `约${left}秒`
  };
}

async function insertFakeVolunteers(taskId) {
  const existing = await dbGet('SELECT id FROM fake_volunteer_responses WHERE task_id = ? LIMIT 1', [taskId]);
  if (existing) return;

  for (const item of fakeSeedVolunteers()) {
    await dbRun(
      `INSERT INTO fake_volunteer_responses
       (task_id, name, phone, role, status, progress, eta_text, move_start_at, move_duration_sec, is_active)
       VALUES (?, ?, ?, ?, '待响应', 0, '待响应', 0, 30, 1)`,
      [taskId, item.name, item.phone, item.role]
    );
  }
}

async function triggerFakeVolunteerResponses(taskId) {
  const fakeRows = await dbAll(
    `SELECT * FROM fake_volunteer_responses
     WHERE task_id = ? AND is_active = 1
     ORDER BY id`,
    [taskId]
  );
  const pending = fakeRows.filter((item) => item.status === '待响应' && !item.move_start_at);
  if (!pending.length) return;

  const count = pending.length > 1 && Math.random() < 0.5 ? 2 : 1;
  const shuffled = [...pending].sort(() => Math.random() - 0.5).slice(0, count);
  const nowMs = Date.now();

  for (const item of shuffled) {
    const isWang = item.name === '王秀兰';
    const duration = isWang ? randInt(20, 35) : randInt(30, 45);
    await dbRun(
      `UPDATE fake_volunteer_responses
       SET status = '前往中',
           progress = 1,
           eta_text = ?,
           move_start_at = ?,
           move_duration_sec = ?
       WHERE id = ?`,
      [`${duration}秒`, nowMs, duration, item.id]
    );
  }
}

router.post('/create', async (req, res) => {
  try {
    const { openid, position, locationLabel, taskSource = 'manual', emergencyMode = false } = req.body;
    if (!openid) return res.status(400).json({ success: false, message: '缺少 openid' });

    const taskId = `task_${Date.now()}`;
    const nowMs = Date.now();
    const latitude = Number(position?.latitude ?? 19.99839);
    const longitude = Number(position?.longitude ?? 110.152305);

    await dbRun(
      `INSERT INTO sos_tasks
       (task_id, openid, task_source, system_status, location_label, latitude, longitude, risk_value, emergency_mode, emergency_started_at, emergency_trigger_type, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        openid,
        taskSource,
        'sos',
        locationLabel || '当前位置',
        latitude,
        longitude,
        85,
        emergencyMode ? 1 : 0,
        emergencyMode ? nowMs : null,
        taskSource === 'manual' ? '手动 SOS' : '自动触发',
        1
      ]
    );

    const contacts = [
      { name: '妈妈', relation: '家人', phone: '138****1111' },
      { name: '室友小林', relation: '朋友', phone: '139****2222' },
      { name: '社区网格员', relation: '工作人员', phone: '137****3333' }
    ];

    for (const contact of contacts) {
      await dbRun(
        `INSERT INTO emergency_contacts (sos_task_id, name, relation, phone, status)
         VALUES (?, ?, ?, ?, ?)`,
        [taskId, contact.name, contact.relation, contact.phone, '待发送']
      );
    }

    await insertFakeVolunteers(taskId);

    res.json({
      success: true,
      message: 'SOS任务创建成功',
      data: {
        taskId,
        status: 'created',
        emergencyContactsCount: contacts.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '创建失败', error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const row = await dbGet(
      `SELECT * FROM sos_tasks
       WHERE is_active = 1
       ORDER BY datetime(created_at) DESC, id DESC
       LIMIT 1`
    );

    if (!row) {
      return res.json({
        success: true,
        data: null,
        message: '暂无活跃SOS任务'
      });
    }

    res.json({
      success: true,
      data: {
        taskId: row.task_id,
        taskSource: row.task_source,
        systemStatus: row.system_status,
        requesterPosition: {
          latitude: row.latitude,
          longitude: row.longitude
        },
        locationLabel: row.location_label,
        riskValue: row.risk_value,
        emergencyMode: Boolean(row.emergency_mode),
        emergencyStartedAt: row.emergency_started_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const row = await dbGet('SELECT * FROM sos_tasks WHERE task_id = ? AND is_active = 1', [taskId]);
    if (!row) return res.status(404).json({ success: false, message: '任务不存在或已结束' });

    const requesterPosition = {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude)
    };
    const contacts = await dbAll('SELECT * FROM emergency_contacts WHERE sos_task_id = ?', [taskId]);
    const fakeRows = await dbAll(
      `SELECT * FROM fake_volunteer_responses
       WHERE task_id = ? AND is_active = 1
       ORDER BY id`,
      [taskId]
    );
    const realRows = await dbAll(
      `SELECT * FROM real_volunteer_responses
       WHERE task_id = ?
       ORDER BY id`,
      [taskId]
    );

    const fakeVolunteers = fakeRows.map((item, index) => {
      const moving = buildMovingStatus(item);
      const role = getFakeVolunteerRole(item);
      return {
        id: `fake_${item.id}`,
        name: item.name,
        phone: item.phone,
        role,
        job: role,
        honor: role,
        ...fakePosition(index, requesterPosition),
        status: moving.status,
        progress: moving.progress,
        etaText: moving.etaText,
        isReal: false
      };
    });

    const realVolunteers = realRows.map((item, index) => {
      const moving = buildMovingStatus(item);
      return {
        id: `real_${item.user_id || item.id}`,
        userId: item.user_id,
        name: item.username,
        username: item.username,
        phone: item.phone,
        role: '流动志愿者',
        job: '流动志愿者',
        honor: '流动志愿者',
        ...realPosition(index, requesterPosition),
        status: moving.status,
        progress: moving.progress,
        etaText: moving.etaText,
        isReal: true
      };
    });

    res.json({
      success: true,
      data: {
        taskId: row.task_id,
        taskSource: row.task_source,
        systemStatus: row.system_status,
        requesterPosition,
        locationLabel: row.location_label,
        riskValue: row.risk_value,
        emergencyMode: Boolean(row.emergency_mode),
        emergencyStartedAt: row.emergency_started_at,
        emergencyTriggerType: row.emergency_trigger_type,
        emergencyContacts: contacts,
        volunteers: [...fakeVolunteers, ...realVolunteers],
        updatedAt: row.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/cancel/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { openid } = req.body;
    const row = await dbGet(
      'SELECT * FROM sos_tasks WHERE task_id = ? AND openid = ? AND is_active = 1',
      [taskId, openid]
    );
    if (!row) return res.status(404).json({ success: false, message: '任务不存在或不属于当前用户' });
    if (row.task_source !== 'manual') {
      return res.status(400).json({ success: false, message: '仅可取消手动 SOS' });
    }

    await dbRun(
      `UPDATE sos_tasks
       SET is_active = 0, system_status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE task_id = ?`,
      [taskId]
    );
    res.json({ success: true, message: 'SOS任务已取消' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/volunteer/respond-real', async (req, res) => {
  try {
    const { taskId, userId, username, phone, openid } = req.body;
    if (!taskId || !userId) {
      return res.status(400).json({ success: false, message: '缺少 taskId 或 userId' });
    }

    const task = await dbGet('SELECT * FROM sos_tasks WHERE task_id = ? AND is_active = 1', [taskId]);
    if (!task) return res.status(404).json({ success: false, message: '任务不存在' });

    const nowMs = Date.now();
    const duration = Math.floor(Math.random() * 20) + 25;
    const existing = await dbGet(
      'SELECT id FROM real_volunteer_responses WHERE task_id = ? AND user_id = ?',
      [taskId, userId]
    );

    if (existing) {
      await dbRun(
        `UPDATE real_volunteer_responses
         SET username = ?,
             phone = ?,
             openid = ?,
             status = '前往中',
             progress = 1,
             eta_text = ?,
             move_start_at = ?,
             move_duration_sec = ?
         WHERE task_id = ? AND user_id = ?`,
        [username, phone, openid, `${duration}秒`, nowMs, duration, taskId, userId]
      );
    } else {
      await dbRun(
        `INSERT INTO real_volunteer_responses
         (task_id, user_id, username, phone, openid, status, progress, eta_text, move_start_at, move_duration_sec)
         VALUES (?, ?, ?, ?, ?, '前往中', 1, ?, ?, ?)`,
        [taskId, userId, username, phone, openid, `${duration}秒`, nowMs, duration]
      );
    }

    await triggerFakeVolunteerResponses(taskId);

    res.json({
      success: true,
      message: '流动志愿者响应成功',
      data: {
        userId,
        username,
        phone,
        status: '前往中',
        progress: 1,
        etaText: `${duration}秒`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/volunteer/respond', async (req, res) => {
  res.status(400).json({
    success: false,
    message: '请使用 /api/sos/volunteer/respond-real 响应流动志愿者'
  });
});

module.exports = router;
