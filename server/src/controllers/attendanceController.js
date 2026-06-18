const { pool } = require('../config/database');

// 1. Get attendance status for all workers at a site for a specific day
const getAttendanceForDay = async (req, res, next) => {
  try {
    const { siteId, date } = req.query;

    if (!siteId || !date) {
      return res.status(400).json({ message: 'siteId and date parameters are required.' });
    }

    // Role-based security isolation
    if (req.user.role === 'SUPERVISOR' && req.user.site_id !== parseInt(siteId)) {
      return res.status(403).json({ 
        message: 'Access denied. You are not authorized to view attendance for this construction site.' 
      });
    }

    // Check site exists
    const [siteRows] = await pool.query('SELECT site_name FROM sites WHERE id = ?', [siteId]);
    if (siteRows.length === 0) {
      return res.status(404).json({ message: 'Construction site not found.' });
    }

    // Fetch active workers assigned to the site
    const [workers] = await pool.query(
      `SELECT id, worker_code, full_name, designation, daily_wage 
       FROM workers 
       WHERE site_id = ? AND is_active = 1
       ORDER BY full_name ASC`,
      [siteId]
    );

    // Fetch existing marked attendance for that date
    const [attendance] = await pool.query(
      `SELECT worker_id, status, id AS attendance_id 
       FROM attendance 
       WHERE site_id = ? AND attendance_date = ?`,
      [siteId, date]
    );

    // Map existing attendance onto worker roster list
    const attendanceMap = new Map();
    attendance.forEach(att => {
      attendanceMap.set(att.worker_id, {
        attendanceId: att.attendance_id,
        status: att.status
      });
    });

    const roster = workers.map(worker => {
      const marked = attendanceMap.get(worker.id);
      return {
        id: worker.id,
        workerCode: worker.worker_code,
        fullName: worker.full_name,
        designation: worker.designation,
        dailyWage: parseFloat(worker.daily_wage),
        status: marked ? marked.status : null, // null means unmarked
        attendanceId: marked ? marked.attendanceId : null
      };
    });

    return res.status(200).json({
      siteName: siteRows[0].site_name,
      date,
      roster
    });
  } catch (error) {
    next(error);
  }
};

// 2. Save bulk attendance (Create/Update)
const saveBulkAttendance = async (req, res, next) => {
  let dbConnection;
  try {
    const { site_id, attendance_date, records } = req.body;

    // Role-based security check
    if (req.user.role === 'SUPERVISOR' && req.user.site_id !== parseInt(site_id)) {
      return res.status(403).json({ 
        message: 'Access denied. You are not authorized to submit attendance for this construction site.' 
      });
    }

    // Start a transaction using a single connection from pool
    dbConnection = await pool.getConnection();
    await dbConnection.beginTransaction();

    // Verify all workers in records belong to this site and exist
    const workerIds = records.map(r => r.worker_id);
    const [siteWorkers] = await dbConnection.query(
      'SELECT id FROM workers WHERE site_id = ? AND id IN (?)',
      [site_id, workerIds]
    );

    if (siteWorkers.length !== workerIds.length) {
      await dbConnection.rollback();
      return res.status(400).json({ 
        message: 'Validation failed. Some workers are not registered or do not belong to the selected site.' 
      });
    }

    // Execute bulk insert on duplicate key update
    const query = `
      INSERT INTO attendance (worker_id, site_id, attendance_date, status, marked_by)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by), updated_at = CURRENT_TIMESTAMP
    `;

    for (const record of records) {
      await dbConnection.query(query, [
        record.worker_id,
        site_id,
        attendance_date,
        record.status,
        req.user.id
      ]);
    }

    await dbConnection.commit();
    return res.status(200).json({ message: 'Attendance records saved successfully.' });

  } catch (error) {
    if (dbConnection) {
      await dbConnection.rollback();
    }
    next(error);
  } finally {
    if (dbConnection) {
      dbConnection.release();
    }
  }
};

// 3. Search and filter attendance logs
const getAttendanceLogs = async (req, res, next) => {
  try {
    const { siteId, startDate, endDate, status, search, page = 1, limit = 15 } = req.query;

    let query = `
      FROM attendance a
      JOIN workers w ON a.worker_id = w.id
      JOIN sites s ON a.site_id = s.id
      JOIN users u ON a.marked_by = u.id
      WHERE 1=1
    `;
    const params = [];

    // Role restriction
    if (req.user.role === 'SUPERVISOR') {
      query += ` AND a.site_id = ?`;
      params.push(req.user.site_id);
    } else if (siteId) {
      query += ` AND a.site_id = ?`;
      params.push(parseInt(siteId));
    }

    if (status) {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND a.attendance_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND a.attendance_date <= ?`;
      params.push(endDate);
    }

    if (search) {
      query += ` AND (w.full_name LIKE ? OR w.worker_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // Get count
    const [countResult] = await pool.query(`SELECT COUNT(*) AS total ${query}`, params);
    const totalItems = countResult[0].total;

    // Paginate and sort
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY a.attendance_date DESC, w.full_name ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(
      `SELECT a.id, a.attendance_date, a.status, a.updated_at,
              w.worker_code, w.full_name AS worker_name, w.designation,
              s.site_name, u.full_name AS marked_by_name ${query}`,
      params
    );

    const logs = rows.map(row => ({
      id: row.id,
      date: row.attendance_date,
      status: row.status,
      lastUpdated: row.updated_at,
      workerCode: row.worker_code,
      workerName: row.worker_name,
      designation: row.designation,
      siteName: row.site_name,
      markedBy: row.marked_by_name
    }));

    return res.status(200).json({
      data: logs,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceForDay,
  saveBulkAttendance,
  getAttendanceLogs
};
