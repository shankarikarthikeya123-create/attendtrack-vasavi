const { pool } = require('../config/database');

// Get all workers (Admin only, supervisor gets site workers via separate endpoint or query)
const getWorkers = async (req, res, next) => {
  try {
    const { search, siteId, designation, active, page = 1, limit = 10 } = req.query;
    
    let query = `
      FROM workers w
      JOIN sites s ON w.site_id = s.id
      WHERE 1=1
    `;
    const params = [];

    // Search query: name, code, phone
    if (search) {
      query += ` AND (w.full_name LIKE ? OR w.worker_code LIKE ? OR w.phone LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    // Filters
    if (siteId) {
      query += ` AND w.site_id = ?`;
      params.push(parseInt(siteId));
    }
    
    if (designation) {
      query += ` AND w.designation = ?`;
      params.push(designation);
    }

    if (active !== undefined) {
      query += ` AND w.is_active = ?`;
      params.push(active === 'true' ? 1 : 0);
    }

    // Get total count for pagination
    const [countResult] = await pool.query(`SELECT COUNT(*) AS total ${query}`, params);
    const totalItems = countResult[0].total;

    // Add pagination and sorting
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY w.worker_code ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(
      `SELECT w.*, s.site_name ${query}`,
      params
    );

    const workers = rows.map(row => ({
      id: row.id,
      workerCode: row.worker_code,
      fullName: row.full_name,
      phone: row.phone,
      designation: row.designation,
      siteId: row.site_id,
      siteName: row.site_name,
      dailyWage: parseFloat(row.daily_wage),
      joiningDate: row.joining_date,
      address: row.address,
      emergencyContact: row.emergency_contact,
      notes: row.notes,
      isActive: !!row.is_active,
      createdAt: row.created_at
    }));

    return res.status(200).json({
      data: workers,
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

// Get single worker
const getWorkerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT w.*, s.site_name 
       FROM workers w
       JOIN sites s ON w.site_id = s.id
       WHERE w.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    const row = rows[0];
    const worker = {
      id: row.id,
      workerCode: row.worker_code,
      fullName: row.full_name,
      phone: row.phone,
      designation: row.designation,
      siteId: row.site_id,
      siteName: row.site_name,
      dailyWage: parseFloat(row.daily_wage),
      joiningDate: row.joining_date,
      address: row.address,
      emergencyContact: row.emergency_contact,
      notes: row.notes,
      isActive: !!row.is_active,
      createdAt: row.created_at
    };

    return res.status(200).json(worker);
  } catch (error) {
    next(error);
  }
};

// Create a worker
const createWorker = async (req, res, next) => {
  try {
    const { worker_code, full_name, phone, designation, site_id, daily_wage, joining_date, address, emergency_contact, notes } = req.body;

    // Check unique worker_code
    const [existing] = await pool.query('SELECT id FROM workers WHERE worker_code = ?', [worker_code]);
    if (existing.length > 0) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: [{ field: 'worker_code', message: 'Worker code already exists. Must be unique.' }]
      });
    }

    // Check site exists
    const [siteExists] = await pool.query('SELECT id FROM sites WHERE id = ?', [site_id]);
    if (siteExists.length === 0) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: [{ field: 'site_id', message: 'Assigned construction site does not exist.' }]
      });
    }

    const [result] = await pool.query(
      `INSERT INTO workers (worker_code, full_name, phone, designation, site_id, daily_wage, joining_date, address, emergency_contact, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [worker_code.toUpperCase(), full_name, phone, designation, site_id, daily_wage, joining_date, address || null, emergency_contact || null, notes || null]
    );

    return res.status(201).json({
      id: result.insertId,
      message: 'Worker registered successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Update worker details
const updateWorker = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone, designation, site_id, daily_wage, joining_date, address, emergency_contact, notes } = req.body;

    // Verify worker exists
    const [existing] = await pool.query('SELECT id FROM workers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    // Check site exists
    const [siteExists] = await pool.query('SELECT id FROM sites WHERE id = ?', [site_id]);
    if (siteExists.length === 0) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: [{ field: 'site_id', message: 'Assigned construction site does not exist.' }]
      });
    }

    await pool.query(
      `UPDATE workers 
       SET full_name = ?, phone = ?, designation = ?, site_id = ?, daily_wage = ?, joining_date = ?, address = ?, emergency_contact = ?, notes = ? 
       WHERE id = ?`,
      [full_name, phone, designation, site_id, daily_wage, joining_date, address || null, emergency_contact || null, notes || null, id]
    );

    return res.status(200).json({ message: 'Worker details updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Toggle worker status (Deactivate / Reactivate)
const toggleWorkerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ message: 'is_active status field is required.' });
    }

    // Verify worker exists
    const [existing] = await pool.query('SELECT id FROM workers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    const activeVal = is_active ? 1 : 0;
    await pool.query('UPDATE workers SET is_active = ? WHERE id = ?', [activeVal, id]);

    const statusMsg = is_active ? 'reactivated' : 'deactivated';
    return res.status(200).json({ message: `Worker successfully ${statusMsg}.` });
  } catch (error) {
    next(error);
  }
};

// Get single worker attendance history summary
const getWorkerAttendanceSummary = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verify worker exists
    const [existing] = await pool.query('SELECT full_name FROM workers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    // Fetch attendance logs grouped by status
    const [summary] = await pool.query(
      `SELECT status, COUNT(*) AS count 
       FROM attendance 
       WHERE worker_id = ? 
       GROUP BY status`,
      [id]
    );

    // Fetch last 10 logs
    const [logs] = await pool.query(
      `SELECT a.attendance_date, a.status, s.site_name, u.full_name AS marked_by_name
       FROM attendance a
       JOIN sites s ON a.site_id = s.id
       JOIN users u ON a.marked_by = u.id
       WHERE a.worker_id = ?
       ORDER BY a.attendance_date DESC
       LIMIT 10`,
      [id]
    );

    return res.status(200).json({
      workerName: existing[0].full_name,
      summary,
      recentLogs: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  toggleWorkerStatus,
  getWorkerAttendanceSummary
};
