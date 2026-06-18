const { pool } = require('../config/database');
const { calculateSalary } = require('../services/salaryService');

const getMonthlyReport = async (req, res, next) => {
  try {
    const { month, year, siteId, search, designation } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'month and year parameters are required.' });
    }

    // Role-based security check for supervisor
    const effectiveSiteId = req.user.role === 'SUPERVISOR' ? req.user.site_id : siteId;

    if (req.user.role === 'SUPERVISOR' && !req.user.site_id) {
      return res.status(400).json({ message: 'Supervisor is not assigned to any site.' });
    }

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    
    // 1. Fetch Workers
    let workersQuery = `
      SELECT w.id, w.worker_code, w.full_name, w.designation, w.daily_wage, w.site_id, s.site_name 
      FROM workers w
      JOIN sites s ON w.site_id = s.id
      WHERE 1=1
    `;
    const workersParams = [];

    if (effectiveSiteId) {
      workersQuery += ` AND w.site_id = ?`;
      workersParams.push(parseInt(effectiveSiteId));
    }

    if (designation) {
      workersQuery += ` AND w.designation = ?`;
      workersParams.push(designation);
    }

    if (search) {
      workersQuery += ` AND (w.full_name LIKE ? OR w.worker_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      workersParams.push(searchPattern, searchPattern);
    }

    // We query active workers or workers with attendance history in that month
    // For simplicity, let's list all active workers matching the filters
    workersQuery += ` AND w.is_active = 1 ORDER BY w.full_name ASC`;

    const [workers] = await pool.query(workersQuery, workersParams);
    if (workers.length === 0) {
      return res.status(200).json({
        workers: [],
        summary: {
          totalWorkers: 0,
          presentCount: 0,
          absentCount: 0,
          halfDayCount: 0,
          leaveCount: 0,
          payableDays: 0,
          estimatedPayroll: "0.00"
        }
      });
    }

    // 2. Fetch grouped attendance metrics for this date range
    const workerIds = workers.map(w => w.id);
    const [attendanceRows] = await pool.query(
      `SELECT 
        worker_id,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_days,
        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) AS half_days,
        SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) AS leave_days
       FROM attendance
       WHERE attendance_date BETWEEN ? AND LAST_DAY(?)
       AND worker_id IN (?)
       GROUP BY worker_id`,
      [startDate, startDate, workerIds]
    );

    // Map attendance rows by worker_id
    const attMap = new Map();
    attendanceRows.forEach(row => {
      attMap.set(row.worker_id, {
        present: parseInt(row.present_days),
        absent: parseInt(row.absent_days),
        halfDays: parseInt(row.half_days),
        leave: parseInt(row.leave_days)
      });
    });

    // 3. Assemble and calculate salary per worker
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalHalfDay = 0;
    let totalLeave = 0;
    let totalPayableDays = 0;
    let totalPayroll = 0;

    const reportWorkers = workers.map(w => {
      const att = attMap.get(w.id) || { present: 0, absent: 0, halfDays: 0, leave: 0 };
      
      const { payableDays, grossSalary } = calculateSalary(att.present, att.halfDays, w.daily_wage);

      totalPresent += att.present;
      totalAbsent += att.absent;
      totalHalfDay += att.halfDays;
      totalLeave += att.leave;
      totalPayableDays += payableDays;
      totalPayroll += grossSalary;

      return {
        id: w.id,
        workerCode: w.worker_code,
        fullName: w.full_name,
        designation: w.designation,
        siteName: w.site_name,
        dailyWage: parseFloat(w.daily_wage),
        attendance: {
          present: att.present,
          absent: att.absent,
          halfDay: att.halfDays,
          leave: att.leave
        },
        payableDays,
        grossSalary
      };
    });

    // Fetch site details for header context if filtering single site
    let siteName = 'All Construction Sites';
    if (effectiveSiteId) {
      const [sRows] = await pool.query('SELECT site_name FROM sites WHERE id = ?', [effectiveSiteId]);
      if (sRows.length > 0) {
        siteName = sRows[0].site_name;
      }
    }

    return res.status(200).json({
      siteName,
      month: parseInt(month),
      year: parseInt(year),
      workers: reportWorkers,
      summary: {
        totalWorkers: reportWorkers.length,
        presentCount: totalPresent,
        absentCount: totalAbsent,
        halfDayCount: totalHalfDay,
        leaveCount: totalLeave,
        payableDays: parseFloat(totalPayableDays.toFixed(2)),
        estimatedPayroll: parseFloat(totalPayroll.toFixed(2)).toFixed(2)
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMonthlyReport
};
