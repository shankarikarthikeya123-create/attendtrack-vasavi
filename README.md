# AttendTrack – Worker Attendance Management System

**Client:** Vasavi Constructions, Hyderabad  
**Developers:** Aurora Institute of Technology - Batch 2025-26 (Internship Project)

AttendTrack is a digital worker attendance and wage estimation platform built to replace slow, error-prone paper logs across multiple construction sites. It enforces role-based dashboard lockouts (Admins see all sites, while Supervisors are restricted strictly to their assigned construction site) and provides single-tap daily attendance, monthly report aggregation, and formatted Excel/PDF summary exports.

---

## 1. Technology Stack

- **Frontend:** React.js (via Vite), JavaScript, Tailwind CSS, Axios, Context API, Lucide React (Icons), Recharts (Graphs), React Hot Toast (Notifications), SheetJS / xlsx (Excel Export), jsPDF & jsPDF-AutoTable (PDF Export).
- **Backend:** Node.js, Express.js, JWT Authentication, bcrypt (Password Hashing), express-validator (Request validation), helmet (Security headers), cors, express-rate-limit (Brute-force protection), morgan (Request logs).
- **Database:** MySQL (mysql2/promise connection pool).

---

## 2. MySQL Database Setup

The MySQL schema details sites, users, workers, and attendance with compound unique indexes to guarantee database level duplicate-prevention on date records.

### Database Creation
Run the following SQL commands in your MySQL query console or PhpMyAdmin:

```sql
CREATE DATABASE attendtrack_db;
```

### Import Schema and Seed Data
From the command line, run the initialization script to automatically load the schema and default seed data:

```bash
cd server
npm run db:init
```

---

## 3. Environment Configuration

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=attendtrack_db
JWT_SECRET=8f45a90bc77582b14647321e05acbe3d7120df0357e62a1b028d3ef71109a90a
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

---

## 4. Run Locally

Ensure you have [Node.js](https://nodejs.org) and [XAMPP](https://www.apachefriends.org) (MySQL running on port 3306) set up.

### Start Backend Server
```bash
cd server
npm install
npm run dev
```
The server will run on `http://localhost:5000`.

### Start Frontend Client
```bash
cd client
npm install --legacy-peer-deps
npm run dev
```
The client will start on `http://localhost:5173`.

---

## 5. Development Login Credentials

These credentials are pre-loaded in the database:

| Role | Username / Email | Password | Assigned Site / Scope |
|---|---|---|---|
| **Admin** | `admin` / `admin@vasavi.com` | `password123` | All Construction Sites |
| **Site 1 Supervisor** | `rajesh.site1` / `rajesh@vasavi.com` | `password123` | Vasavi Prime Heights |
| **Site 2 Supervisor** | `srinivas.site2` / `srinivas@vasavi.com` | `password123` | Vasavi Cyber Plaza |
| **Site 3 Supervisor** | `mahesh.site3` / `mahesh@vasavi.com` | `password123` | Vasavi Urban Woods |

---

## 6. Key Application Features

### 1. Security & RBAC (Role-Based Access Control)
- **Token Verification:** Custom authentication middleware decodes JWT details and appends user identifiers (`req.user`) to request scopes.
- **Access Isolation:** Supervisor actions are bound to `req.user.site_id` fetched from the verified JWT payload. Attempts by supervisors to query other site IDs result in `403 Forbidden` errors.
- **Brute-Force Guard:** Login rate limiter blocks brute force attacks. Deactivated user accounts are denied login access.

### 2. Daily Attendance marking (Mobile-First)
- Supervisors use touch-friendly (44px target) grids to record `PRESENT`, `ABSENT`, `HALF_DAY`, or `LEAVE` statuses.
- **Bulk Save Transaction:** Bulk logs insert using a database transaction with `ON DUPLICATE KEY UPDATE` to support corrections and prevent duplicate rows.

### 3. Salary Calculation
Calculations are processed on the server and rounded to 2 decimal places:
- **Payable Days Formula:**  
  $$\text{payableDays} = \text{presentDays} + (\text{halfDayCount} \times 0.5)$$
- **Salary Formula:**  
  $$\text{grossSalary} = \text{payableDays} \times \text{dailyWageRate}$$

### 4. Excel & PDF Exports
- **Excel:** Generates bold headings, autosized column widths, currency formats, and summary calculations using `xlsx` (SheetJS).
- **PDF:** Draws high contrast tabular outputs with summary blocks, company sub-headers, and formula footnotes.

---

## 7. Folder Structure Overview

```
server/
  src/
    config/           # Database promise connection pools
    controllers/      # Auth, Workers, Sites, Attendance, Reports
    middleware/       # JWT auth, role validation, error handlers
    routes/           # API endpoints routing map
    services/         # Reusable calculators and helpers
    validators/       # express-validator filters
  database/
    schema.sql        # Database schema script
    seed.sql          # Seed data script
    init.js           # DB setup and hashing seeder
client/
  src/
    api/              # Axios instance configuration
    components/       # Reusable UI blocks, loaders, charts
    context/          # Auth Context provider
    layouts/          # Admin and Supervisor navbar frameworks
    pages/            # Renders auth, dashboard, list pages
    routes/           # Protected routes and authorization locks
    styles/           # index.css Tailwind config
```
