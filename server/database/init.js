const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initializeDatabase() {
  console.log('Initializing database...');
  
  // Connect without database name first to create it if not exists
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    // Read schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Split statements by semicolon and filter out empty ones
    // We can also use multipleStatements since we enabled it, but let's run them
    console.log('Creating database and tables...');
    await connection.query(schemaSql);
    console.log('Database and tables created successfully.');
    
    // Now switch to attendtrack_db for further operations
    await connection.query('USE attendtrack_db;');
    
    // Check if users table already has data to prevent duplicate seeding
    const [existingUsers] = await connection.query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }

    console.log('Seeding initial data...');

    // 1. Seed Sites
    const sites = [
      {
        site_code: 'VS-HYD-001',
        site_name: 'Vasavi Prime Heights',
        location: 'Gachibowli, Hyderabad',
        description: 'High-rise residential apartment block construction.',
        start_date: '2026-01-15',
        expected_completion_date: '2027-12-31'
      },
      {
        site_code: 'VS-HYD-002',
        site_name: 'Vasavi Cyber Plaza',
        location: 'Madhapur, Hyderabad',
        description: 'Commercial IT park office complex.',
        start_date: '2026-03-01',
        expected_completion_date: '2028-06-30'
      },
      {
        site_code: 'VS-HYD-003',
        site_name: 'Vasavi Urban Woods',
        location: 'Kompally, Hyderabad',
        description: 'Gated community villa project.',
        start_date: '2026-05-10',
        expected_completion_date: '2027-09-30'
      }
    ];

    const siteIds = [];
    for (const site of sites) {
      const [result] = await connection.query(
        'INSERT INTO sites (site_code, site_name, location, description, start_date, expected_completion_date) VALUES (?, ?, ?, ?, ?, ?)',
        [site.site_code, site.site_name, site.location, site.description, site.start_date, site.expected_completion_date]
      );
      siteIds.push(result.insertId);
    }
    console.log('Seeded 3 sites.');

    // 2. Hash Password for Users
    const passwordHash = await bcrypt.hash('password123', 10);

    // 3. Seed Admin User
    const [adminResult] = await connection.query(
      'INSERT INTO users (full_name, email, username, phone, password_hash, role, site_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['System Admin', 'admin@vasavi.com', 'admin', '9876543210', passwordHash, 'ADMIN', null]
    );
    const adminId = adminResult.insertId;
    console.log('Seeded Admin user.');

    // 4. Seed Supervisors
    const supervisors = [
      {
  full_name: 'Shankari Karthikeya',
  email: 'shankari.karthikeya123@gmail.com',
  username: 'Karthikeya.site1',
  phone: '9618098112',
  role: 'SUPERVISOR',
  site_id: siteIds[0]
      },
      {
        full_name: 'Srinivas Rao',
        email: 'srinivas@vasavi.com',
        username: 'srinivas.site2',
        phone: '9848023456',
        role: 'SUPERVISOR',
        site_id: siteIds[1]
      },
      {
        full_name: 'Mahesh Babu',
        email: 'mahesh@vasavi.com',
        username: 'mahesh.site3',
        phone: '9848034567',
        role: 'SUPERVISOR',
        site_id: siteIds[2]
      }
    ];

    const supervisorIds = [];
    for (const sup of supervisors) {
      const [result] = await connection.query(
        'INSERT INTO users (full_name, email, username, phone, password_hash, role, site_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [sup.full_name, sup.email, sup.username, sup.phone, passwordHash, sup.role, sup.site_id]
      );
      supervisorIds.push(result.insertId);
    }
    console.log('Seeded 3 supervisors.');

    // 5. Seed Workers (at least 15)
    const workers = [
      // Site 1 workers
      { worker_code: 'W-1001', full_name: 'Kalyan Singh', phone: '9000100001', designation: 'Mason', site_id: siteIds[0], daily_wage: 750.00, joining_date: '2026-01-20', address: 'Kukatpally, Hyderabad', emergency_contact: '9000100002', notes: 'Experienced bricklayer' },
      { worker_code: 'W-1002', full_name: 'Ramesh Prasad', phone: '9000100003', designation: 'Carpenter', site_id: siteIds[0], daily_wage: 800.00, joining_date: '2026-01-22', address: 'Miyapur, Hyderabad', emergency_contact: '9000100004', notes: 'Woodwork specialist' },
      { worker_code: 'W-1003', full_name: 'Suresh Naik', phone: '9000100005', designation: 'Electrician', site_id: siteIds[0], daily_wage: 850.00, joining_date: '2026-02-01', address: 'Ameerpet, Hyderabad', emergency_contact: '9000100006', notes: 'Certified wiring technician' },
      { worker_code: 'W-1004', full_name: 'Mohammed Ali', phone: '9000100007', designation: 'Helper', site_id: siteIds[0], daily_wage: 500.00, joining_date: '2026-02-05', address: 'Tolichowki, Hyderabad', emergency_contact: '9000100008', notes: 'General assistance' },
      { worker_code: 'W-1005', full_name: 'Vijay Kumar', phone: '9000100009', designation: 'Site Labourer', site_id: siteIds[0], daily_wage: 500.00, joining_date: '2026-02-10', address: 'Borabanda, Hyderabad', emergency_contact: '9000100010', notes: 'Hardworking manual labor' },

      // Site 2 workers
      { worker_code: 'W-1006', full_name: 'Anil Reddy', phone: '9000200001', designation: 'Plumber', site_id: siteIds[1], daily_wage: 800.00, joining_date: '2026-03-05', address: 'Madhapur, Hyderabad', emergency_contact: '9000200002', notes: 'Sanitary and piping' },
      { worker_code: 'W-1007', full_name: 'Shiva Kumar', phone: '9000200003', designation: 'Painter', site_id: siteIds[1], daily_wage: 700.00, joining_date: '2026-03-10', address: 'Yousufguda, Hyderabad', emergency_contact: '9000200004', notes: 'Exterior and interior painting' },
      { worker_code: 'W-1008', full_name: 'Balu Naik', phone: '9000200005', designation: 'Welder', site_id: siteIds[1], daily_wage: 900.00, joining_date: '2026-03-12', address: 'Secunderabad, Hyderabad', emergency_contact: '9000200006', notes: 'Structural welding expert' },
      { worker_code: 'W-1009', full_name: 'Laxman Rao', phone: '9000200007', designation: 'Helper', site_id: siteIds[1], daily_wage: 500.00, joining_date: '2026-03-15', address: 'Bala Nagar, Hyderabad', emergency_contact: '9000200008', notes: 'General site helper' },
      { worker_code: 'W-1010', full_name: 'Prakash Gowd', phone: '9000200009', designation: 'Supervisor Assistant', site_id: siteIds[1], daily_wage: 600.00, joining_date: '2026-03-20', address: 'Kondapur, Hyderabad', emergency_contact: '9000200010', notes: 'Assists with materials and logs' },

      // Site 3 workers
      { worker_code: 'W-1011', full_name: 'Ravi Teja', phone: '9000300001', designation: 'Tile Worker', site_id: siteIds[2], daily_wage: 850.00, joining_date: '2026-05-12', address: 'Kompally, Hyderabad', emergency_contact: '9000300002', notes: 'Flooring specialist' },
      { worker_code: 'W-1012', full_name: 'Krishna Murthy', phone: '9000300003', designation: 'Mason', site_id: siteIds[2], daily_wage: 750.00, joining_date: '2026-05-15', address: 'Alwal, Hyderabad', emergency_contact: '9000300004', notes: 'Wall constructions' },
      { worker_code: 'W-1013', full_name: 'Gopal Das', phone: '9000300005', designation: 'Helper', site_id: siteIds[2], daily_wage: 500.00, joining_date: '2026-05-18', address: 'Bolarum, Hyderabad', emergency_contact: '9000300006', notes: 'Material shifting helper' },
      { worker_code: 'W-1014', full_name: 'Nirmala Devi', phone: '9000300007', designation: 'Site Labourer', site_id: siteIds[2], daily_wage: 500.00, joining_date: '2026-05-20', address: 'Medchal, Hyderabad', emergency_contact: '9000300008', notes: 'Site cleaning and labor' },
      { worker_code: 'W-1015', full_name: 'Satish Goud', phone: '9000300009', designation: 'Carpenter', site_id: siteIds[2], daily_wage: 800.00, joining_date: '2026-05-22', address: 'Bowenpally, Hyderabad', emergency_contact: '9000300010', notes: 'Door and window frames' }
    ];

    const workerIds = [];
    for (const wrk of workers) {
      const [result] = await connection.query(
        'INSERT INTO workers (worker_code, full_name, phone, designation, site_id, daily_wage, joining_date, address, emergency_contact, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [wrk.worker_code, wrk.full_name, wrk.phone, wrk.designation, wrk.site_id, wrk.daily_wage, wrk.joining_date, wrk.address, wrk.emergency_contact, wrk.notes]
      );
      workerIds.push({ id: result.insertId, site_id: wrk.site_id });
    }
    console.log('Seeded 15 workers.');

    // 6. Seed Attendance History for last 3 days
    // Let's assume current date is 2026-06-16 (from local time).
    // Seed attendance for 2026-06-13, 2026-06-14, 2026-06-15.
    const dates = ['2026-06-13', '2026-06-14', '2026-06-15'];
    
    // Statuses helper: assign some variety
    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'];

    let attCount = 0;
    for (const date of dates) {
      for (const w of workerIds) {
        // Map supervisor for the site to be marked_by
        let markedBy = adminId;
        if (w.site_id === siteIds[0]) markedBy = supervisorIds[0];
        else if (w.site_id === siteIds[1]) markedBy = supervisorIds[1];
        else if (w.site_id === siteIds[2]) markedBy = supervisorIds[2];

        // Random status but mostly present to look realistic
        // Let's use a deterministic random index based on worker id and date characters
        const charSum = date.split('').reduce((sum, c) => sum + (c.charCodeAt(0) || 0), 0);
        const idx = (w.id + charSum) % statuses.length;
        const status = statuses[idx];

        await connection.query(
          'INSERT INTO attendance (worker_id, site_id, attendance_date, status, marked_by) VALUES (?, ?, ?, ?, ?)',
          [w.id, w.site_id, date, status, markedBy]
        );
        attCount++;
      }
    }
    console.log(`Seeded ${attCount} attendance records.`);
    console.log('Database initialization completed successfully!');

  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

initializeDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
