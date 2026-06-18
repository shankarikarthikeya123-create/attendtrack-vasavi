const { pool } = require('../config/database');

// Get all construction sites (Admin only)
const getSites = async (req, res, next) => {
  try {
    const { active } = req.query;
    let query = `
      SELECT 
        s.*, 
        (SELECT COUNT(*) FROM workers w WHERE w.site_id = s.id AND w.is_active = 1) AS worker_count,
        u.full_name AS supervisor_name,
        u.id AS supervisor_id
      FROM sites s
      LEFT JOIN users u ON s.id = u.site_id AND u.role = 'SUPERVISOR' AND u.is_active = 1
    `;
    
    const params = [];
    if (active !== undefined) {
      query += ` WHERE s.is_active = ?`;
      params.push(active === 'true' ? 1 : 0);
    }
    
    query += ` ORDER BY s.created_at DESC`;

    const [rows] = await pool.query(query, params);
    
    // Format response
    const sites = rows.map(row => ({
      id: row.id,
      siteCode: row.site_code,
      siteName: row.site_name,
      location: row.location,
      description: row.description,
      startDate: row.start_date,
      expectedCompletionDate: row.expected_completion_date,
      isActive: !!row.is_active,
      workerCount: parseInt(row.worker_count),
      supervisor: row.supervisor_id ? {
        id: row.supervisor_id,
        name: row.supervisor_name
      } : null,
      createdAt: row.created_at
    }));

    return res.status(200).json(sites);
  } catch (error) {
    next(error);
  }
};

// Get single construction site
const getSiteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM workers w WHERE w.site_id = s.id AND w.is_active = 1) AS worker_count,
              u.full_name AS supervisor_name,
              u.id AS supervisor_id
       FROM sites s
       LEFT JOIN users u ON s.id = u.site_id AND u.role = 'SUPERVISOR' AND u.is_active = 1
       WHERE s.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Construction site not found.' });
    }

    const row = rows[0];
    const site = {
      id: row.id,
      siteCode: row.site_code,
      siteName: row.site_name,
      location: row.location,
      description: row.description,
      startDate: row.start_date,
      expectedCompletionDate: row.expected_completion_date,
      isActive: !!row.is_active,
      workerCount: parseInt(row.worker_count),
      supervisor: row.supervisor_id ? {
        id: row.supervisor_id,
        name: row.supervisor_name
      } : null,
      createdAt: row.created_at
    };

    return res.status(200).json(site);
  } catch (error) {
    next(error);
  }
};

// Create a new construction site
const createSite = async (req, res, next) => {
  try {
    const { site_code, site_name, location, description, start_date, expected_completion_date } = req.body;

    // Check if site code already exists
    const [existing] = await pool.query('SELECT id FROM sites WHERE site_code = ?', [site_code]);
    if (existing.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed.',
        errors: [{ field: 'site_code', message: 'Site code already exists. Please use a unique code.' }] 
      });
    }

    const [result] = await pool.query(
      `INSERT INTO sites (site_code, site_name, location, description, start_date, expected_completion_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [site_code.toUpperCase(), site_name, location, description || null, start_date, expected_completion_date || null]
    );

    return res.status(201).json({
      id: result.insertId,
      message: 'Construction site created successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing construction site
const updateSite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { site_name, location, description, start_date, expected_completion_date } = req.body;

    // Verify site exists
    const [existing] = await pool.query('SELECT id FROM sites WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Construction site not found.' });
    }

    await pool.query(
      `UPDATE sites 
       SET site_name = ?, location = ?, description = ?, start_date = ?, expected_completion_date = ? 
       WHERE id = ?`,
      [site_name, location, description || null, start_date, expected_completion_date || null, id]
    );

    return res.status(200).json({ message: 'Construction site updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// Toggle active status (deactivate / reactivate)
const toggleSiteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body; // Expecting boolean true/false

    if (is_active === undefined) {
      return res.status(400).json({ message: 'is_active status field is required.' });
    }

    // Verify site exists
    const [existing] = await pool.query('SELECT id FROM sites WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Construction site not found.' });
    }

    const activeVal = is_active ? 1 : 0;
    await pool.query('UPDATE sites SET is_active = ? WHERE id = ?', [activeVal, id]);

    const statusMsg = is_active ? 'reactivated' : 'deactivated';
    return res.status(200).json({ message: `Construction site successfully ${statusMsg}.` });
  } catch (error) {
    next(error);
  }
};

// Get workers for a specific site (Admin or assigned Supervisor)
const getSiteWorkers = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Role-based security check
    if (req.user.role === 'SUPERVISOR' && req.user.site_id !== parseInt(id)) {
      return res.status(403).json({ 
        message: 'Access denied. You are not authorized to access worker data for this construction site.' 
      });
    }

    const [rows] = await pool.query(
      `SELECT id, worker_code, full_name, phone, designation, daily_wage, joining_date, is_active 
       FROM workers 
       WHERE site_id = ? AND is_active = 1
       ORDER BY full_name ASC`,
      [id]
    );

    const workers = rows.map(row => ({
      id: row.id,
      workerCode: row.worker_code,
      fullName: row.full_name,
      phone: row.phone,
      designation: row.designation,
      dailyWage: parseFloat(row.daily_wage),
      joiningDate: row.joining_date,
      isActive: !!row.is_active
    }));

    return res.status(200).json(workers);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  toggleSiteStatus,
  getSiteWorkers
};
