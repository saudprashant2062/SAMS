# Student Attendance Management System (SAMS)

Production-ready Node.js (Express) + Prisma + PostgreSQL backend for managing students, teachers, attendance, and admin provisioning. Domain-based architecture with role-based access control.

## 🏗️ Architecture

### Core Principles

1. **Domain ≠ Role**: Attendance, Assignment, User Management are domains. Roles control access.
2. **Single Source of Truth**: TeachingAssignment → AttendanceSession → AttendanceRecord
3. **Soft Delete Everywhere**: Enables undo, audit trails, and safe reports.

### Role Permissions

| Feature              | Admin  | Teacher     | Student     |
| -------------------- | ------ | ----------- | ----------- |
| User Management      | ✅     | ❌          | ❌          |
| Academic Structure   | ✅     | ❌          | ❌          |
| Teaching Assignments | ✅     | View Own    | ❌          |
| Attendance Sessions  | ✅     | Own Classes | ❌          |
| Mark Attendance      | ✅     | Own Classes | ❌          |
| View Attendance      | ✅ All | Own Classes | Own Records |
| Semester Promotion   | ✅     | ❌          | ❌          |

## 🚀 Features

- JWT auth with refresh tokens and password reset via email
- Role-based access: Admin, Teacher, Student
- Admin CRUD for departments, semesters, sections, subjects, teaching assignments
- User provisioning (single or CSV bulk)
- Full attendance management with soft delete cascade
- Bulk semester promotion
- Attendance summary reports
- Teacher tools: manage assignments, create sessions, mark attendance
- Student self-service: profile, subjects, attendance records, and summaries
- Swagger UI with full route coverage

## 📚 API Endpoints

### Auth (`/api/auth`)

- `POST /login` - Login
- `POST /logout` - Logout
- `POST /refresh-token` - Refresh access token
- `GET /me` - Get current user profile
- `PATCH /reset-password` - Change password (authenticated)
- `POST /forgot-password` - Request reset email
- `POST /reset-password-token` - Reset with token

### Admin: Attendance (`/api/admin/attendance`)

- `GET /sessions` - List sessions (with filters)
- `GET /sessions/:id` - Get session details
- `POST /sessions` - Create session
- `PATCH /sessions/:id` - Update session
- `DELETE /sessions/:id` - Soft delete (cascades to records)
- `POST /records` - Mark attendance (bulk)
- `PATCH /records/:id` - Update record
- `DELETE /records/:id` - Soft delete record
- `GET /summary/section/:section_id` - Section summary

### Admin: Sections (`/api/admin/sections`)

- CRUD operations
- `POST /promote` - Bulk semester promotion

### Teachers (`/api/teachers`)

- `GET /me` - Profile
- `GET /assignments` - My assignments
- `POST /attendance/session` - Create session
- `POST /attendance/mark` - Mark attendance

### Students (`/api/students`)

- `GET /me` - Profile
- `GET /attendance` - Records with filters
- `GET /attendance/summary` - Summary by subject

## Tech Stack

- Node.js, Express 5
- Prisma ORM with PostgreSQL
- Zod for validation
- Multer for uploads, Cloudinary integration
- Nodemailer for email delivery
- Sentry integration

## Getting Started

1. Install dependencies

```
npm install
```

2. Configure environment (see `.env` template below).
3. Generate Prisma client and apply migrations

```
npm run prisma:generate
npm run prisma:migrate
```

4. Run the server

```
# development
npm run start:dev

# production
npm start
```

5. Open docs at `http://localhost:5000/api/docs`.

## Environment Variables

Create a `.env` file in the project root with at least:

```
# Core
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
FRONTEND_URL=http://localhost:5173

# JWT
ACCESS_TOKEN_SECRET=change-me
REFRESH_TOKEN_SECRET=change-me-too
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=15d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@example.com
EMAIL_PASSWORD=app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Scripts

- `npm start` — run server
- `npm run start:dev` — run with nodemon
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:migrate` — run development migrations

## Swagger

Full OpenAPI is defined in `src/docs/swagger.js` and served at `/api/docs`.

## License

ISC © Aryan Saud and Safal Shyangwa
