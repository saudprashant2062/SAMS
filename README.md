# Student Attendance Management System (SAMS)

A comprehensive, production-ready full-stack application for managing student attendance in educational institutions. Built with modern technologies and best practices for scalability, security, and maintainability.

## 🎯 Overview

SAMS is a complete attendance management solution that handles the entire lifecycle of attendance tracking in educational institutions. From user management to attendance recording and reporting, SAMS provides a seamless experience for administrators, teachers, and students.

### Key Highlights

- 🚀 **Production-Ready**: Built with industry best practices
- 🔐 **Secure**: JWT authentication with refresh tokens and role-based access
- 📱 **Responsive**: Modern UI with Material-UI and Tailwind CSS
- 📊 **Comprehensive**: Full-featured attendance management
- 📈 **Scalable**: Domain-based architecture with PostgreSQL and Prisma

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SAMS Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │    Frontend (React)  │      │   Backend (Express)  │        │
│  │                      │      │                      │        │
│  │  • React + Vite      │◄────►│  • Node.js + Express │        │
│  │  • Redux Toolkit     │      │  • Prisma ORM        │        │
│  │  • Material-UI       │      │  • PostgreSQL        │        │
│  │  • Tailwind CSS      │      │  • JWT Auth          │        │
│  └──────────────────────┘      └──────────────────────┘        │
│            │                            │                      │
│            │      ┌────────────────────┐                       │
│            └─────►│                    │                       │
│                   │  PostgreSQL        │                       │
│                   │  Database          │                       │
│                   │                    │                       │
│                   └────────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend

- **Framework**: React 19 with Vite
- **State Management**: Redux Toolkit
- **UI Components**: Material-UI (MUI) 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Form Validation**: Zod
- **Icons**: React Icons

### Backend

- **Runtime**: Node.js
- **Framework**: Express 5
- **ORM**: Prisma 7
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **File Upload**: Multer + Cloudinary
- **Monitoring**: Sentry
- **API Documentation**: Swagger UI
- **Validation**: Zod

## 📁 Project Structure

```
SAMS/
├── README.md                           # Root documentation
├── SAMS_FRONTEND/                      # React frontend application
│   ├── src/
│   │   ├── api/                       # API integration layer
│   │   ├── app/store/                 # Redux store configuration
│   │   ├── components/                # Reusable UI components
│   │   ├── features/                  # Redux slices and features
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── layouts/                   # Page layouts (Admin, Teacher, Student)
│   │   ├── pages/                     # Page components
│   │   ├── routes/                    # Application routing
│   │   ├── schemas/                   # Form validation schemas
│   │   ├── utils/                     # Utility functions
│   │   ├── App.jsx                    # Root application component
│   │   └── main.jsx                   # Application entry point
│   ├── public/                        # Static assets
│   ├── index.html                     # HTML template
│   ├── package.json                   # Frontend dependencies
│   ├── vite.config.js                 # Vite configuration
│   └── README.md                      # Frontend documentation
│
└── student-attendance-management-system/  # Express backend API
    ├── src/
    │   ├── config/                    # Configuration files
    │   ├── constants/                 # Application constants
    │   ├── controllers/               # Request handlers
    │   ├── docs/                      # Swagger documentation
    │   ├── jobs/                      # Scheduled jobs
    │   ├── middlewares/               # Express middlewares
    │   ├── routes/                    # API route definitions
    │   ├── services/                  # Business logic layer
    │   ├── utils/                     # Utility functions
    │   ├── validators/                # Input validation schemas
    │   ├── app.js                     # Express application setup
    │   └── index.js                   # Application entry point
    ├── prisma/
    │   ├── schema.prisma              # Database schema
    │   └── migrations/                # Database migrations
    ├── uploads/                       # Uploaded files
    ├── package.json                   # Backend dependencies
    └── README.md                      # Backend documentation
```

## 👥 User Roles

### 🅰️ Administrator

- Complete user management (create, update, delete, activate/deactivate)
- Academic structure management (departments, semesters, sections, subjects)
- Teaching assignments management
- Bulk user provisioning via CSV
- System-wide attendance management
- Activity logging and monitoring
- Report generation

### 👨‍🏫 Teacher

- View assigned courses and sections
- Create and manage attendance sessions
- Mark student attendance
- View attendance reports for assigned classes
- Profile management

### 👨‍🎓 Student

- View own attendance records
- Access subject-wise attendance summaries
- Profile management
- Password management

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**
- **Git**

### Quick Start

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd SAMS
```

#### 2. Backend Setup

```bash
cd student-attendance-management-system

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and service credentials

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start the server
npm run start:dev
```

The backend will run at `http://localhost:5000`

#### 3. Frontend Setup

```bash
cd SAMS_FRONTEND

# Install dependencies
npm install

# Configure environment variables
# Create .env file with API URL

# Start the development server
npm run dev
```

The frontend will run at `http://localhost:5173`

#### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api/docs

## 📊 Database Schema

The system uses a comprehensive relational database schema with the following core entities:

- **Users**: Authentication and authorization
- **Students**: Student records linked to users
- **Teachers**: Teacher records linked to users
- **Departments**: Academic departments
- **Semesters**: Academic semesters within departments
- **Sections**: Class sections within semesters
- **Subjects**: Courses/subjects
- **Batches**: Student batches/years
- **TeachingAssignments**: Links teachers to subjects and sections
- **AttendanceSessions**: Individual attendance sessions
- **AttendanceRecords**: Individual student attendance records
- **ActivityLogs**: Audit trail for user actions

All entities support soft delete for data recovery and audit purposes.

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Automatic token refresh mechanism
- **Role-Based Access Control (RBAC)**: Granular permissions
- **Password Hashing**: Secure password storage with bcrypt
- **Email Verification**: Password reset via email
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation with Zod
- **SQL Injection Protection**: Parameterized queries via Prisma
- **XSS Protection**: Security headers with Helmet
- **CORS Configuration**: Controlled cross-origin requests

## 📈 Features

### Core Functionality

- ✅ User Authentication & Authorization
- ✅ Role-Based Access Control
- ✅ Complete CRUD Operations
- ✅ Bulk User Import (CSV)
- ✅ Attendance Recording
- ✅ Attendance Reporting
- ✅ Activity Logging
- ✅ Soft Delete

### Academic Management

- ✅ Department Management
- ✅ Semester Management
- ✅ Section Management
- ✅ Subject Management
- ✅ Batch Management
- ✅ Teaching Assignments
- ✅ Semester Promotion

### Advanced Features

- ✅ Attendance Summaries & Reports
- ✅ Low Attendance Alerts (Automated)
- ✅ Profile Management
- ✅ Password Reset
- ✅ Activity Monitoring
- ✅ File Uploads (Photos, CSV)

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sams

# Frontend URL
FRONTEND_URL=http://localhost:5173

# JWT
ACCESS_TOKEN_SECRET=your-secret-key
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=15d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Documentation

Complete API documentation is available through Swagger UI at:

```
http://localhost:5000/api/docs
```

### Main API Endpoints

#### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user profile

#### Admin Management

- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Soft delete user

#### Academic Structure

- `GET /api/admin/departments` - List departments
- `GET /api/admin/semesters` - List semesters
- `GET /api/admin/sections` - List sections
- `GET /api/admin/subjects` - List subjects

#### Attendance

- `GET /api/admin/attendance/sessions` - List attendance sessions
- `POST /api/admin/attendance/sessions` - Create session
- `POST /api/admin/attendance/records` - Mark attendance

## 🧪 Testing

### Backend Tests

```bash
cd student-attendance-management-system
npm test
```

### Frontend Tests

```bash
cd SAMS_FRONTEND
npm test
```

## 📦 Building for Production

### Frontend Build

```bash
cd SAMS_FRONTEND
npm run build
```

The build output will be in the `dist/` directory.

### Backend Production

```bash
cd student-attendance-management-system
npm start
```

## 🔄 Deployment

### Recommended Deployment

- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Heroku, Railway, DigitalOcean App Platform, or AWS EC2
- **Database**: PostgreSQL on Supabase, Railway, or AWS RDS
- **File Storage**: Cloudinary or AWS S3

### Environment Considerations

- Set `NODE_ENV=production`
- Use strong, unique secrets for JWT
- Configure proper CORS origins
- Set up SSL/TLS certificates
- Configure proper logging and monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **Aryan Saud** - Primary Developer
- **Safal Shyangwa** - Primary Developer

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Material-UI](https://mui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express](https://expressjs.com/)

---

For detailed documentation, please refer to:

- [Frontend README](SAMS_FRONTEND/README.md)
- [Backend README](student-attendance-management-system/README.md)

Built with ❤️ for educational institutions
