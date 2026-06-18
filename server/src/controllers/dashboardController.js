const { pool } = require('../config/database');

const getAdminDashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfMonth = `${today.substring(0, 7)}-01`;

    // 1. Summary Cards
    const [workerCountRes] = await pool.query('SELECT COUNT(*) AS total FROM workers WHERE is_active = 1');
    const [siteCountRes] = await pool.query('SELECT COUNT(*) AS total FROM sites WHERE is_active = 1');
    const [supervisorCountRes] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'SUPERVISOR' AND is_active = 1");

    // Today's attendance stats
    const [todayStatsRes] = await pool.query(
      `SELECT status, COUNT(*) AS count 
       FROM attendance 
       WHERE attendance_date = ? 
       GROUP BY status`,
      [today]
    );

    const todayStats = {
      PRESENT: 0,
      ABSENT: 0,
      HALF_DAY: 0,
      LEAVE: 0
    };
    todayStatsRes.forEach(row => {
      todayStats[row.status] = parseInt(row.count);
    });

    // Current month payroll estimation
    // payableDays = presentDays + (halfDayCount * 0.5)
    // grossSalary = payableDays * dailyWageRate
    const [payrollRes] = await pool.query(
      `SELECT a.status, w.daily_wage 
       FROM attendance a 
       JOIN workers w ON a.worker_id = w.id 
       WHERE a.attendance_date BETWEEN ? AND ?`,
      [startOfMonth, today]
    );

    let estPayroll = 0;
    payrollRes.forEach(row => {
      const dailyWage = parseFloat(row.daily_wage);
      if (row.status === 'PRESENT') {
        estPayroll += dailyWage;
      } else if (row.status === 'HALF_DAY') {
        estPayroll += dailyWage * 0.5;
      }
    });

    // 2. Site Attendance Progress
    const [siteProgressRes] = await pool.query(
      `SELECT 
        s.id,
        s.site_name,
        s.site_code,
        (SELECT COUNT(*) FROM workers w WHERE w.site_id = s.id AND w.is_active = 1) AS total_workers,
        (SELECT COUNT(*) FROM attendance a WHERE a.site_id = s.id AND a.attendance_date = ?) AS marked_workers,
        (SELECT u.full_name FROM users u WHERE u.site_id = s.id AND u.role = 'SUPERVISOR' AND u.is_active = 1 LIMIT 1) AS supervisor_name
      FROM sites s
      WHERE s.is_active = 1`,
      [today]
    );

    const siteProgress = siteProgressRes.map(row => {
      const total = parseInt(row.total_workers);
      const marked = parseInt(row.marked_workers);
      return {
        id: row.id,
        siteName: row.site_name,
        siteCode: row.site_code,
        supervisorName: row.supervisor_name || 'Unassigned',
        totalWorkers: total,
        markedWorkers: marked,
        isCompleted: total > 0 && marked >= total,
        progressPercent: total > 0 ? Math.round((marked / total) * 100) : 0
      };
    });

    // 3. Monthly Attendance Trends (last 15 days)
    const [trendsRes] = await pool.query(
      `SELECT 
        attendance_date AS date,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) AS halfDay,
        SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) AS \`leave\`
      FROM attendance
      WHERE attendance_date >= DATE_SUB(?, INTERVAL 15 DAY)
      GROUP BY attendance_date
      ORDER BY attendance_date ASC`,
      [today]
    );

    // 4. Site-Wise Worker Distribution
    const [distributionRes] = await pool.query(
      `SELECT s.site_name AS siteName, COUNT(w.id) AS workerCount
       FROM sites s
       LEFT JOIN workers w ON s.id = w.site_id AND w.is_active = 1
       WHERE s.is_active = 1
       GROUP BY s.id, s.site_name`
    );

    // 5. Recent Attendance Activity (last 5 submissions)
    const [recentActivityRes] = await pool.query(
      `SELECT 
        s.site_name AS siteName,
        u.full_name AS supervisorName,
        a.attendance_date AS date,
        COUNT(a.id) AS workersMarked,
        MAX(a.updated_at) AS lastMarkedTime
      FROM attendance a
      JOIN sites s ON a.site_id = s.id
      JOIN users u ON a.marked_by = u.id
      GROUP BY a.site_id, a.attendance_date, u.full_name
      ORDER BY lastMarkedTime DESC
      LIMIT 5`
    );

    // 6. Payroll Summary per Site (for current month)
    const [sitePayrollRes] = await pool.query(
      `SELECT 
        s.id,
        s.site_name AS siteName,
        COUNT(DISTINCT w.id) AS workerCount,
        SUM(CASE WHEN a.status = 'PRESENT' THEN w.daily_wage 
                 WHEN a.status = 'HALF_DAY' THEN w.daily_wage * 0.5 
                 ELSE 0 END) AS estimatedPayroll
      FROM sites s
      JOIN workers w ON s.id = w.site_id
      LEFT JOIN attendance a ON w.id = a.worker_id AND a.attendance_date BETWEEN ? AND ?
      WHERE s.is_active = 1
      GROUP BY s.id, s.site_name`,
      [startOfMonth, today]
    );

    const sitePayroll = sitePayrollRes.map(row => ({
      id: row.id,
      siteName: row.siteName,
      workerCount: parseInt(row.workerCount),
      estimatedPayroll: parseFloat(row.estimatedPayroll || 0).toFixed(2)
    }));

    return res.status(200).json({
      summary: {
        totalWorkers: workerCountRes[0].total,
        totalSites: siteCountRes[0].total,
        totalSupervisors: supervisorCountRes[0].total,
        presentToday: todayStats.PRESENT,
        absentToday: todayStats.ABSENT,
        halfDayToday: todayStats.HALF_DAY,
        leaveToday: todayStats.LEAVE,
        estimatedPayroll: estPayroll.toFixed(2)
      },
      siteProgress,
      monthlyTrends: trendsRes,
      workerDistribution: distributionRes,
      recentActivity: recentActivityRes,
      sitePayroll
    });
  } catch (error) {
    next(error);
  }
};

const getSupervisorDashboard = async (req, res, next) => {
  try {
    const supervisorSiteId = req.user.site_id;
    if (!supervisorSiteId) {
      return res.status(400).json({ message: 'Supervisor is not assigned to any construction site.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = `${today.substring(0, 7)}-01`;

    // Fetch site details
    const [siteRows] = await pool.query(
      'SELECT site_name, location, site_code FROM sites WHERE id = ?',
      [supervisorSiteId]
    );
    
    if (siteRows.length === 0) {
      return res.status(404).json({ message: 'Assigned construction site not found.' });
    }
    const site = siteRows[0];

    // 1. Workers Count
    const [workersCountRes] = await pool.query(
      'SELECT COUNT(*) AS total FROM workers WHERE site_id = ? AND is_active = 1',
      [supervisorSiteId]
    );
    const totalWorkers = workersCountRes[0].total;

    // 2. Today's Attendance stats for this site
    const [todayStatsRes] = await pool.query(
      `SELECT status, COUNT(*) AS count 
       FROM attendance 
       WHERE site_id = ? AND attendance_date = ? 
       GROUP BY status`,
      [supervisorSiteId, today]
    );

    const todayStats = {
      PRESENT: 0,
      ABSENT: 0,
      HALF_DAY: 0,
      LEAVE: 0
    };
    todayStatsRes.forEach(row => {
      todayStats[row.status] = parseInt(row.count);
    });

    const totalMarkedToday = Object.values(todayStats).reduce((a, b) => a + b, 0);

    // 3. Last attendance submission info
    const [lastSubmissionRes] = await pool.query(
      `SELECT updated_at, attendance_date 
       FROM attendance 
       WHERE site_id = ? 
       ORDER BY attendance_date DESC, updated_at DESC 
       LIMIT 1`,
      [supervisorSiteId]
    );
    const lastSubmission = lastSubmissionRes.length > 0 ? {
      date: lastSubmissionRes[0].attendance_date,
      time: lastSubmissionRes[0].updated_at
    } : null;

    // 4. Monthly snapshot for current month on this site
    const [monthlySnapshotRes] = await pool.query(
      `SELECT 
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) AS presentCount,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) AS absentCount,
        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) AS halfDayCount,
        SUM(CASE WHEN status = 'LEAVE' THEN 1 ELSE 0 END) AS leaveCount
       FROM attendance 
       WHERE site_id = ? AND attendance_date BETWEEN ? AND ?`,
      [supervisorSiteId, startOfMonth, today]
    );

    const monthlySnapshot = {
      present: parseInt(monthlySnapshotRes[0].presentCount || 0),
      absent: parseInt(monthlySnapshotRes[0].absentCount || 0),
      halfDay: parseInt(monthlySnapshotRes[0].halfDayCount || 0),
      leave: parseInt(monthlySnapshotRes[0].leaveCount || 0)
    };

    // 5. Recent attendance dates (last 7 submission dates)
    const [recentDatesRes] = await pool.query(
      `SELECT DISTINCT attendance_date 
       FROM attendance 
       WHERE site_id = ? 
       ORDER BY attendance_date DESC 
       LIMIT 7`,
      [supervisorSiteId]
    );
    const recentDates = recentDatesRes.map(row => row.attendance_date);

    return res.status(200).json({
      site: {
        id: supervisorSiteId,
        name: site.site_name,
        code: site.site_code,
        location: site.location
      },
      summary: {
        totalWorkers,
        presentToday: todayStats.PRESENT,
        absentToday: todayStats.ABSENT,
        halfDayToday: todayStats.HALF_DAY,
        leaveToday: todayStats.LEAVE,
        markedWorkers: totalMarkedToday,
        remainingWorkers: totalWorkers - totalMarkedToday,
        isCompleted: totalWorkers > 0 && totalMarkedToday >= totalWorkers,
        progressPercent: totalWorkers > 0 ? Math.round((totalMarkedToday / totalWorkers) * 100) : 0
      },
      lastSubmission,
      monthlySnapshot,
      recentDates
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getSupervisorDashboard
};
