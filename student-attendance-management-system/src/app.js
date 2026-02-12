import express from 'express';
import './config/instrument.js';
import * as Sentry from '@sentry/node';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.js';

import authRoutes from './routes/auth.route.js';
import adminUserRoutes from './routes/admin/user.route.js';
import adminDepartmentRoutes from './routes/admin/department.route.js';
import adminSemesterRoutes from './routes/admin/semester.route.js';
import adminSectionRoutes from './routes/admin/section.route.js';
import adminSubjectRoutes from './routes/admin/subject.route.js';
import adminTeachingAssignmentRoutes from './routes/admin/teachingAssignment.route.js';
import adminAttendanceRoutes from './routes/admin/attendance.route.js';
import adminReportRoutes from './routes/admin/report.route.js';
import adminBatchRoutes from './routes/admin/batch.route.js';
import adminActivityLogRoutes from './routes/admin/activityLog.route.js';
import teacherRoutes from './routes/teacher.route.js';
import studentRoutes from './routes/student.route.js';

import errorHandler from './middlewares/errorHandler.middleware.js';

const app = express();

/* ------------------------------
   GLOBAL MIDDLEWARES
------------------------------ */

// Trust first proxy (Render, Railway, etc.) — required for secure cookies behind reverse proxy
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(helmet());

// CORS configuration - ensure FRONTEND_URL is set in production
const corsOrigin = process.env.FRONTEND_URL;
if (!corsOrigin) {
    console.warn('WARNING: FRONTEND_URL not set. CORS will be restricted to localhost.');
}

app.use(
    cors({
        origin: corsOrigin || 'http://localhost:5173',
        credentials: true,
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

/* ------------------------------
SWAGGER SETUP
------------------------------ */

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/* ------------------------------
   ROUTES
------------------------------ */

// app.get('/ping', (req, res) => {
//     res.status(200).send('pong');
// });

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin/departments', adminDepartmentRoutes);
app.use('/api/admin/semesters', adminSemesterRoutes);
app.use('/api/admin/sections', adminSectionRoutes);
app.use('/api/admin/subjects', adminSubjectRoutes);
app.use('/api/admin/teaching-assignments', adminTeachingAssignmentRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/admin/batches', adminBatchRoutes);
app.use('/api/admin/activity-logs', adminActivityLogRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);

/* ------------------------------
   SENTRY ERROR HANDLER
------------------------------ */
Sentry.setupExpressErrorHandler(app);

/* ------------------------------
   CENTRAL ERROR HANDLER
------------------------------ */
app.use(errorHandler);

export default app;
