const swaggerDocument = {
    openapi: '3.0.3',
    info: {
        title: 'Student Attendance Management System API',
        version: '2.0.0',
        description:
            'Production-ready API for Student Attendance Management System. Domain-based architecture with role-based access control.',
    },
    servers: [{ url: 'http://localhost:5000/api', description: 'Local' }],
    tags: [
        { name: 'Auth', description: 'Authentication and password flows' },
        { name: 'Students', description: 'Student self-service endpoints' },
        { name: 'Teachers', description: 'Teacher tools and attendance management' },
        { name: 'Admin: Users', description: 'Admin user provisioning and status' },
        { name: 'Admin: Departments', description: 'Department management' },
        { name: 'Admin: Semesters', description: 'Semester management' },
        { name: 'Admin: Sections', description: 'Section management and promotion' },
        { name: 'Admin: Subjects', description: 'Subject management' },
        {
            name: 'Admin: Teaching Assignments',
            description: 'Link teachers to sections and subjects',
        },
        {
            name: 'Admin: Attendance',
            description: 'Full attendance management with soft delete cascade',
        },
    ],
    paths: {
        /* --------------------------------
         * Auth
         * ------------------------------ */
        '/auth/me': {
            get: {
                tags: ['Auth'],
                summary: 'Get current user profile',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'User profile retrieved',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserProfileResponse' },
                            },
                        },
                    },
                    401: { description: 'Unauthorized' },
                },
            },
        },
        '/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login with email and password',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LoginRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Login successful',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/LoginResponse' },
                            },
                        },
                    },
                    401: { description: 'Invalid credentials' },
                    422: { description: 'Validation failed' },
                },
            },
        },
        '/auth/logout': {
            post: {
                tags: ['Auth'],
                summary: 'Logout by invalidating refresh token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/LogoutRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Logged out',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                            },
                        },
                    },
                    400: { description: 'Refresh token missing' },
                },
            },
        },
        '/auth/refresh-token': {
            post: {
                tags: ['Auth'],
                summary: 'Issue new access token using refresh token cookie',
                responses: {
                    200: {
                        description: 'Access token refreshed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AccessTokenResponse' },
                            },
                        },
                    },
                    400: { description: 'Refresh token missing' },
                    401: { description: 'Refresh token invalid or expired' },
                },
            },
        },
        '/auth/forgot-password': {
            post: {
                tags: ['Auth'],
                summary: 'Send reset link to email',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ForgotPasswordRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Reset link dispatched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                            },
                        },
                    },
                    404: { description: 'User not found' },
                },
            },
        },
        '/auth/reset-password': {
            patch: {
                tags: ['Auth'],
                summary: 'Update password (authenticated user)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Password updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                            },
                        },
                    },
                    401: { description: 'Old password invalid' },
                },
            },
        },
        '/auth/reset-password-token': {
            post: {
                tags: ['Auth'],
                summary: 'Update password using reset token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ResetWithTokenRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Password reset',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                            },
                        },
                    },
                    400: { description: 'Token invalid or expired' },
                },
            },
        },

        /* --------------------------------
         * Students
         * ------------------------------ */
        '/students/attendance': {
            get: {
                tags: ['Students'],
                summary: 'List attendance records with optional filters',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'subject_id',
                        in: 'query',
                        schema: { type: 'string', format: 'uuid' },
                        description: 'Filter by subject ID',
                    },
                    {
                        name: 'start_date',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                        description: 'ISO start date',
                    },
                    {
                        name: 'end_date',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                        description: 'ISO end date',
                    },
                ],
                responses: {
                    200: {
                        description: 'Attendance records',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/StudentAttendanceListResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/students/attendance/summary': {
            get: {
                tags: ['Students'],
                summary: 'Attendance summary per subject and overall',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Summary returned',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/StudentAttendanceSummaryResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/students/subjects': {
            get: {
                tags: ['Students'],
                summary: 'Subjects and teachers for current section',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Subjects fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/StudentSubjectsResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/students/section': {
            get: {
                tags: ['Students'],
                summary: 'Section info with classmates',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Section info fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/StudentSectionResponse' },
                            },
                        },
                    },
                },
            },
        },

        /* --------------------------------
         * Teachers
         * ------------------------------ */
        '/teachers/assignments': {
            get: {
                tags: ['Teachers'],
                summary: 'List my teaching assignments',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Assignments listed',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/TeachingAssignmentListResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/teachers/assignments/{id}': {
            get: {
                tags: ['Teachers'],
                summary: 'Get assignment by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Assignment fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/TeachingAssignmentResponse' },
                            },
                        },
                    },
                    403: { description: 'Forbidden for other teachers' },
                },
            },
        },
        '/teachers/attendance/session': {
            post: {
                tags: ['Teachers'],
                summary: 'Create attendance session for an assignment',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateAttendanceSessionRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Session created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AttendanceSessionResponse' },
                            },
                        },
                    },
                    403: { description: 'Not owner of assignment' },
                },
            },
        },
        '/teachers/attendance/mark': {
            post: {
                tags: ['Teachers'],
                summary: 'Mark or update attendance for a session',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MarkAttendanceRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Records updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AttendanceRecordsResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/teachers/attendance/{session_id}': {
            get: {
                tags: ['Teachers'],
                summary: 'Get attendance records for a session',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'session_id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Attendance records fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AttendanceRecordsResponse' },
                            },
                        },
                    },
                    404: { description: 'Session not found' },
                },
            },
        },

        /* --------------------------------
         * Admin: Users
         * ------------------------------ */
        '/admin/users/students': {
            post: {
                tags: ['Admin: Users'],
                summary: 'Create single student with user account',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { $ref: '#/components/schemas/CreateStudentRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Student created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/StudentResponse' },
                            },
                        },
                    },
                    422: { description: 'Validation failed' },
                },
            },
            get: {
                tags: ['Admin: Users'],
                summary: 'List all students with optional filters',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'department_id',
                        in: 'query',
                        schema: { type: 'string', format: 'uuid' },
                        description: 'Filter by department',
                    },
                    {
                        name: 'semester_id',
                        in: 'query',
                        schema: { type: 'string', format: 'uuid' },
                        description: 'Filter by semester',
                    },
                    {
                        name: 'section_id',
                        in: 'query',
                        schema: { type: 'string', format: 'uuid' },
                        description: 'Filter by section',
                    },
                    {
                        name: 'is_active',
                        in: 'query',
                        schema: { type: 'boolean' },
                        description: 'Filter by active status',
                    },
                ],
                responses: {
                    200: {
                        description: 'Students listed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/StudentListResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/users/teachers': {
            post: {
                tags: ['Admin: Users'],
                summary: 'Create single teacher with user account',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { $ref: '#/components/schemas/CreateTeacherRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Teacher created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/TeacherResponse' },
                            },
                        },
                    },
                    422: { description: 'Validation failed' },
                },
            },
            get: {
                tags: ['Admin: Users'],
                summary: 'List all teachers with optional filters',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'is_active',
                        in: 'query',
                        schema: { type: 'boolean' },
                        description: 'Filter by active status',
                    },
                    {
                        name: 'designation',
                        in: 'query',
                        schema: { type: 'string' },
                        description: 'Filter by designation',
                    },
                ],
                responses: {
                    200: {
                        description: 'Teachers listed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/TeacherListResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/users/students/bulk': {
            post: {
                tags: ['Admin: Users'],
                summary: 'Bulk create students via CSV',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { $ref: '#/components/schemas/BulkCsvUploadRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Bulk students created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                            },
                        },
                    },
                    400: { description: 'File missing' },
                },
            },
        },
        '/admin/users/teachers/bulk': {
            post: {
                tags: ['Admin: Users'],
                summary: 'Bulk create teachers via CSV',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { $ref: '#/components/schemas/BulkCsvUploadRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Bulk teachers created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                            },
                        },
                    },
                    400: { description: 'File missing' },
                },
            },
        },
        '/admin/users/users': {
            get: {
                tags: ['Admin: Users'],
                summary: 'List all users (any role)',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Users listed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserListResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/users/users/{id}': {
            get: {
                tags: ['Admin: Users'],
                summary: 'Get user by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'User fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserResponse' },
                            },
                        },
                    },
                    404: { description: 'User not found' },
                },
            },
        },
        '/admin/users/users/{id}/activate': {
            patch: {
                tags: ['Admin: Users'],
                summary: 'Activate user (soft enable)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'User activated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/users/users/{id}/deactivate': {
            patch: {
                tags: ['Admin: Users'],
                summary: 'Deactivate user (soft disable)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'User deactivated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/UserResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/users/admins': {
            post: {
                tags: ['Admin: Users'],
                summary: 'Create admin user',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { $ref: '#/components/schemas/CreateAdminRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Admin created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AdminResponse' },
                            },
                        },
                    },
                    422: { description: 'Validation failed' },
                },
            },
        },
        '/admin/users/admins/{id}': {
            patch: {
                tags: ['Admin: Users'],
                summary: 'Update admin user details',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateAdminRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Admin updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AdminResponse' },
                            },
                        },
                    },
                    404: { description: 'Admin not found' },
                },
            },
            delete: {
                tags: ['Admin: Users'],
                summary: 'Delete admin user',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Admin deleted',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AdminResponse' },
                            },
                        },
                    },
                    404: { description: 'Admin not found' },
                },
            },
        },

        /* --------------------------------
         * Admin: Departments
         * ------------------------------ */
        '/admin/departments': {
            post: {
                tags: ['Admin: Departments'],
                summary: 'Create department',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateDepartmentRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Department created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DepartmentResponse' },
                            },
                        },
                    },
                },
            },
            get: {
                tags: ['Admin: Departments'],
                summary: 'List departments',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Departments listed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DepartmentListResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/departments/{id}': {
            get: {
                tags: ['Admin: Departments'],
                summary: 'Get department by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Department fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DepartmentResponse' },
                            },
                        },
                    },
                },
            },
            patch: {
                tags: ['Admin: Departments'],
                summary: 'Update department name',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateDepartmentRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Department updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DepartmentResponse' },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ['Admin: Departments'],
                summary: 'Soft delete department',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Department deleted',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/DepartmentResponse' },
                            },
                        },
                    },
                },
            },
        },

        /* --------------------------------
         * Admin: Semesters
         * ------------------------------ */
        '/admin/semesters': {
            post: {
                tags: ['Admin: Semesters'],
                summary: 'Create semester',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateSemesterRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Semester created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SemesterResponse' },
                            },
                        },
                    },
                },
            },
            get: {
                tags: ['Admin: Semesters'],
                summary: 'List semesters',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Semesters listed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SemesterListResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/semesters/{id}': {
            get: {
                tags: ['Admin: Semesters'],
                summary: 'Get semester by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Semester fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SemesterResponse' },
                            },
                        },
                    },
                },
            },
            patch: {
                tags: ['Admin: Semesters'],
                summary: 'Update semester',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateSemesterRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Semester updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SemesterResponse' },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ['Admin: Semesters'],
                summary: 'Delete semester',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Semester deleted',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SemesterResponse' },
                            },
                        },
                    },
                },
            },
        },

        /* --------------------------------
         * Admin: Sections
         * ------------------------------ */
        '/admin/sections': {
            post: {
                tags: ['Admin: Sections'],
                summary: 'Create section',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateSectionRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Section created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SectionResponse' },
                            },
                        },
                    },
                },
            },
            get: {
                tags: ['Admin: Sections'],
                summary: 'List sections',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Sections listed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SectionListResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/sections/{id}': {
            get: {
                tags: ['Admin: Sections'],
                summary: 'Get section by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Section fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SectionResponse' },
                            },
                        },
                    },
                },
            },
            put: {
                tags: ['Admin: Sections'],
                summary: 'Update section',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateSectionRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Section updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SectionResponse' },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ['Admin: Sections'],
                summary: 'Delete section',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Section deleted',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/sections/promote': {
            post: {
                tags: ['Admin: Sections'],
                summary: 'Bulk promote students to next semester',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/PromoteSemesterRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Semester promotion completed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/PromoteSemesterResponse' },
                            },
                        },
                    },
                    404: { description: 'Department or semester not found' },
                },
            },
        },

        /* --------------------------------
         * Admin: Attendance
         * ------------------------------ */
        '/admin/attendance/sessions': {
            get: {
                tags: ['Admin: Attendance'],
                summary: 'List all attendance sessions with filters',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'department_id',
                        in: 'query',
                        schema: { type: 'string', format: 'uuid' },
                    },
                    {
                        name: 'semester_id',
                        in: 'query',
                        schema: { type: 'string', format: 'uuid' },
                    },
                    { name: 'section_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'subject_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    { name: 'teacher_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
                    {
                        name: 'start_date',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                    },
                    {
                        name: 'end_date',
                        in: 'query',
                        schema: { type: 'string', format: 'date-time' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Attendance sessions listed',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/AttendanceSessionListResponse',
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ['Admin: Attendance'],
                summary: 'Create attendance session',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateAttendanceSessionRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Session created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AttendanceSessionResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/attendance/sessions/{id}': {
            get: {
                tags: ['Admin: Attendance'],
                summary: 'Get attendance session by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Session fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AttendanceSessionResponse' },
                            },
                        },
                    },
                    404: { description: 'Session not found' },
                },
            },
            patch: {
                tags: ['Admin: Attendance'],
                summary: 'Update attendance session',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    session_date: { type: 'string', format: 'date-time' },
                                },
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Session updated' } },
            },
            delete: {
                tags: ['Admin: Attendance'],
                summary: 'Soft delete session (cascades to records)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: { 200: { description: 'Session and records deleted' } },
            },
        },
        '/admin/attendance/records': {
            post: {
                tags: ['Admin: Attendance'],
                summary: 'Mark attendance (bulk)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MarkAttendanceRequest' },
                        },
                    },
                },
                responses: { 200: { description: 'Attendance marked' } },
            },
        },
        '/admin/attendance/records/{id}': {
            patch: {
                tags: ['Admin: Attendance'],
                summary: 'Update single attendance record',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', enum: ['PRESENT', 'ABSENT'] },
                                },
                                required: ['status'],
                            },
                        },
                    },
                },
                responses: { 200: { description: 'Record updated' } },
            },
            delete: {
                tags: ['Admin: Attendance'],
                summary: 'Soft delete attendance record',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: { 200: { description: 'Record deleted' } },
            },
        },
        '/admin/attendance/summary/section/{section_id}': {
            get: {
                tags: ['Admin: Attendance'],
                summary: 'Get attendance summary by section',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'section_id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Summary fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/AttendanceSummaryResponse' },
                            },
                        },
                    },
                },
            },
        },

        /* --------------------------------
         * Admin: Subjects
         * ------------------------------ */
        '/admin/subjects': {
            post: {
                tags: ['Admin: Subjects'],
                summary: 'Create subject',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateSubjectRequest' },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Subject created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SubjectResponse' },
                            },
                        },
                    },
                },
            },
            get: {
                tags: ['Admin: Subjects'],
                summary: 'List subjects',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Subjects listed',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SubjectListResponse' },
                            },
                        },
                    },
                },
            },
        },
        '/admin/subjects/{id}': {
            get: {
                tags: ['Admin: Subjects'],
                summary: 'Get subject by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Subject fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SubjectResponse' },
                            },
                        },
                    },
                },
            },
            patch: {
                tags: ['Admin: Subjects'],
                summary: 'Update subject',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateSubjectRequest' },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Subject updated',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SubjectResponse' },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ['Admin: Subjects'],
                summary: 'Delete subject',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Subject deleted',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SubjectResponse' },
                            },
                        },
                    },
                },
            },
        },

        /* --------------------------------
         * Admin: Teaching Assignments
         * ------------------------------ */
        '/admin/teaching-assignments': {
            post: {
                tags: ['Admin: Teaching Assignments'],
                summary: 'Create teaching assignment',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateTeachingAssignmentRequest',
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Assignment created',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/TeachingAssignmentResponse' },
                            },
                        },
                    },
                },
            },
            get: {
                tags: ['Admin: Teaching Assignments'],
                summary: 'List teaching assignments',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Assignments listed',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/TeachingAssignmentListResponse',
                                },
                            },
                        },
                    },
                },
            },
        },
        '/admin/teaching-assignments/{id}': {
            get: {
                tags: ['Admin: Teaching Assignments'],
                summary: 'Get teaching assignment by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Assignment fetched',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/TeachingAssignmentResponse' },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ['Admin: Teaching Assignments'],
                summary: 'Delete teaching assignment',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    200: {
                        description: 'Assignment deleted',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MessageResponse' },
                            },
                        },
                    },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            /* ---------- Shared ---------- */
            MessageResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                },
            },
            PaginatedListMeta: {
                type: 'object',
                properties: {
                    count: { type: 'integer' },
                },
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    fullname: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone_number: { type: 'string' },
                    photo_url: { type: 'string', nullable: true },
                    role: { type: 'string', enum: ['ADMIN', 'TEACHER', 'STUDENT'] },
                    is_active: { type: 'boolean' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            UserListResponse: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                },
            },
            UserResponse: {
                type: 'object',
                properties: {
                    data: { $ref: '#/components/schemas/User' },
                    message: { type: 'string' },
                },
            },

            /* ---------- Auth ---------- */
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'teacher@example.com' },
                    password: { type: 'string', example: 'Password@123' },
                },
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                        type: 'object',
                        properties: {
                            user: { $ref: '#/components/schemas/User' },
                            tokens: { $ref: '#/components/schemas/AuthTokens' },
                        },
                    },
                },
            },
            LogoutRequest: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                    refreshToken: { type: 'string' },
                },
            },
            AccessTokenResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Access token refreshed' },
                    data: { $ref: '#/components/schemas/AuthTokens' },
                },
            },
            ForgotPasswordRequest: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
            },
            ResetPasswordRequest: {
                type: 'object',
                required: ['oldPassword', 'newPassword', 'confirmPassword'],
                properties: {
                    oldPassword: { type: 'string' },
                    newPassword: { type: 'string' },
                    confirmPassword: { type: 'string' },
                },
            },
            ResetWithTokenRequest: {
                type: 'object',
                required: ['token', 'newPassword', 'confirmPassword'],
                properties: {
                    token: { type: 'string' },
                    newPassword: { type: 'string' },
                    confirmPassword: { type: 'string' },
                },
            },
            AuthTokens: {
                type: 'object',
                properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                },
            },

            /* ---------- Students ---------- */
            Student: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    stdId: { type: 'string' },
                    roll_no: { type: 'string' },
                    registration_no: { type: 'string', nullable: true },
                    user: { $ref: '#/components/schemas/User' },
                    section: { $ref: '#/components/schemas/Section' },
                },
            },
            StudentProfileResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Student' },
                },
            },
            StudentAttendanceRecord: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    status: { type: 'string', enum: ['PRESENT', 'ABSENT'] },
                    created_at: { type: 'string', format: 'date-time' },
                    session: { $ref: '#/components/schemas/AttendanceSessionWithAssignment' },
                },
            },
            StudentAttendanceListResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/StudentAttendanceRecord' },
                    },
                    count: { type: 'integer' },
                },
            },
            AttendanceSummaryItem: {
                type: 'object',
                properties: {
                    subject: { $ref: '#/components/schemas/SubjectLite' },
                    teacher: { type: 'object', properties: { name: { type: 'string' } } },
                    total_sessions: { type: 'integer' },
                    attended_sessions: { type: 'integer' },
                    absent_sessions: { type: 'integer' },
                    attendance_percentage: { type: 'number' },
                },
            },
            StudentAttendanceSummaryResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            student: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    stdId: { type: 'string' },
                                    roll_no: { type: 'string' },
                                },
                            },
                            overall: {
                                type: 'object',
                                properties: {
                                    total_sessions: { type: 'integer' },
                                    attended_sessions: { type: 'integer' },
                                    absent_sessions: { type: 'integer' },
                                    attendance_percentage: { type: 'number' },
                                },
                            },
                            subjects: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/AttendanceSummaryItem' },
                            },
                        },
                    },
                },
            },
            StudentSubject: {
                type: 'object',
                properties: {
                    assignment_id: { type: 'string', format: 'uuid' },
                    subject: { $ref: '#/components/schemas/SubjectLite' },
                    teacher: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            teacherId: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            photo_url: { type: 'string', nullable: true },
                        },
                    },
                },
            },
            StudentSubjectsResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/StudentSubject' } },
                    count: { type: 'integer' },
                },
            },
            StudentSectionResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            section: { $ref: '#/components/schemas/SectionLite' },
                            department: { $ref: '#/components/schemas/Department' },
                            semester: { $ref: '#/components/schemas/SemesterLite' },
                            classmates: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'string' },
                                        stdId: { type: 'string' },
                                        roll_no: { type: 'string' },
                                        fullname: { type: 'string' },
                                        email: { type: 'string' },
                                        photo_url: { type: 'string', nullable: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            /* ---------- Teachers ---------- */
            Teacher: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    teacherId: { type: 'string' },
                    designation: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                },
            },
            TeacherProfileResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Teacher' },
                },
            },

            /* ---------- Departments ---------- */
            Department: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', enum: ['CSIT', 'BCA', 'BBA', 'BBM', 'MBS'] },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            DepartmentResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Department' },
                },
            },
            DepartmentListResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Department' } },
                },
            },
            CreateDepartmentRequest: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', enum: ['CSIT', 'BCA', 'BBA', 'BBM', 'MBS'] },
                },
            },

            /* ---------- Semesters ---------- */
            Semester: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    number: { type: 'integer' },
                    department_id: { type: 'string', format: 'uuid' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            SemesterLite: {
                type: 'object',
                properties: { id: { type: 'string' }, number: { type: 'integer' } },
            },
            SemesterResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Semester' },
                },
            },
            SemesterListResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Semester' } },
                },
            },
            CreateSemesterRequest: {
                type: 'object',
                required: ['number', 'department_id'],
                properties: {
                    number: { type: 'integer', minimum: 1 },
                    department_id: { type: 'string', format: 'uuid' },
                },
            },

            /* ---------- Sections ---------- */
            Section: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    batch_year: { type: 'integer' },
                    department_id: { type: 'string', format: 'uuid' },
                    semester_id: { type: 'string', format: 'uuid' },
                },
            },
            SectionLite: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    batch_year: { type: 'integer' },
                },
            },
            SectionResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Section' },
                },
            },
            SectionListResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Section' } },
                },
            },
            CreateSectionRequest: {
                type: 'object',
                required: ['name', 'batch_year', 'department_id', 'semester_id'],
                properties: {
                    name: { type: 'string' },
                    batch_year: { type: 'integer', minimum: 2000, maximum: 2100 },
                    department_id: { type: 'string', format: 'uuid' },
                    semester_id: { type: 'string', format: 'uuid' },
                },
            },

            /* ---------- Subjects ---------- */
            Subject: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                    department_id: { type: 'string', format: 'uuid' },
                    semester_id: { type: 'string', format: 'uuid' },
                },
            },
            SubjectLite: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                },
            },
            SubjectResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Subject' },
                },
            },
            SubjectListResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Subject' } },
                },
            },
            CreateSubjectRequest: {
                type: 'object',
                required: ['name', 'code', 'department_id', 'semester_id'],
                properties: {
                    name: { type: 'string' },
                    code: { type: 'string' },
                    department_id: { type: 'string', format: 'uuid' },
                    semester_id: { type: 'string', format: 'uuid' },
                },
            },

            /* ---------- Teaching Assignments ---------- */
            TeachingAssignment: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    teacher_id: { type: 'string', format: 'uuid' },
                    subject_id: { type: 'string', format: 'uuid' },
                    section_id: { type: 'string', format: 'uuid' },
                    teacher: { $ref: '#/components/schemas/Teacher' },
                    subject: { $ref: '#/components/schemas/Subject' },
                    section: { $ref: '#/components/schemas/Section' },
                },
            },
            TeachingAssignmentResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/TeachingAssignment' },
                    message: { type: 'string' },
                },
            },
            TeachingAssignmentListResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', nullable: true },
                    message: { type: 'string', nullable: true },
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/TeachingAssignment' },
                    },
                },
            },
            CreateTeachingAssignmentRequest: {
                type: 'object',
                required: ['teacher_id', 'section_id', 'subject_id'],
                properties: {
                    teacher_id: { type: 'string', format: 'uuid' },
                    section_id: { type: 'string', format: 'uuid' },
                    subject_id: { type: 'string', format: 'uuid' },
                },
            },

            /* ---------- Attendance ---------- */
            AttendanceSession: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    teaching_assignment_id: { type: 'string', format: 'uuid' },
                    session_date: { type: 'string', format: 'date-time' },
                },
            },
            AttendanceSessionWithAssignment: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    session_date: { type: 'string', format: 'date-time' },
                    teaching_assignment: { $ref: '#/components/schemas/TeachingAssignment' },
                },
            },
            AttendanceRecord: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    status: { type: 'string', enum: ['PRESENT', 'ABSENT'] },
                    session_id: { type: 'string', format: 'uuid' },
                    student: { $ref: '#/components/schemas/Student' },
                },
            },
            AttendanceRecordsResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AttendanceRecord' },
                    },
                },
            },
            AttendanceSessionResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/AttendanceSession' },
                },
            },
            CreateAttendanceSessionRequest: {
                type: 'object',
                required: ['teaching_assignment_id'],
                properties: {
                    teaching_assignment_id: { type: 'string', format: 'uuid' },
                    session_date: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Optional, defaults to now',
                    },
                },
            },
            MarkAttendanceRequest: {
                type: 'object',
                required: ['session_id', 'records'],
                properties: {
                    session_id: { type: 'string', format: 'uuid' },
                    records: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['student_id', 'status'],
                            properties: {
                                student_id: { type: 'string', format: 'uuid' },
                                status: { type: 'string', enum: ['PRESENT', 'ABSENT'] },
                            },
                        },
                    },
                },
            },

            /* ---------- Promotion ---------- */
            PromoteSemesterRequest: {
                type: 'object',
                required: ['department_id', 'from_semester_id', 'to_semester_id'],
                properties: {
                    department_id: { type: 'string', format: 'uuid' },
                    from_semester_id: { type: 'string', format: 'uuid' },
                    to_semester_id: { type: 'string', format: 'uuid' },
                },
            },
            PromoteSemesterResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    statusCode: { type: 'integer' },
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            promoted_sections: { type: 'integer' },
                            promoted_students: { type: 'integer' },
                        },
                    },
                },
            },

            /* ---------- Admin Attendance ---------- */
            AttendanceSessionListResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    statusCode: { type: 'integer' },
                    message: { type: 'string' },
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AttendanceSessionWithAssignment' },
                    },
                },
            },
            AttendanceSummaryResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    statusCode: { type: 'integer' },
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            section: { $ref: '#/components/schemas/SectionLite' },
                            students: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        student: { $ref: '#/components/schemas/Student' },
                                        total_sessions: { type: 'integer' },
                                        present_count: { type: 'integer' },
                                        absent_count: { type: 'integer' },
                                        attendance_percentage: { type: 'number' },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            /* ---------- Admin User Creation ---------- */
            CreateStudentRequest: {
                type: 'object',
                required: [
                    'fullname',
                    'email',
                    'password',
                    'phone_number',
                    'roll_no',
                    'section_id',
                ],
                properties: {
                    fullname: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                    phone_number: { type: 'string' },
                    roll_no: { type: 'string' },
                    registration_no: { type: 'string', nullable: true },
                    section_id: { type: 'string', format: 'uuid' },
                    photo: { type: 'string', format: 'binary', nullable: true },
                },
            },
            CreateTeacherRequest: {
                type: 'object',
                required: ['fullname', 'email', 'password', 'phone_number', 'designation'],
                properties: {
                    fullname: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                    phone_number: { type: 'string' },
                    designation: { type: 'string' },
                    photo: { type: 'string', format: 'binary', nullable: true },
                },
            },
            BulkCsvUploadRequest: {
                type: 'object',
                required: ['file'],
                properties: { file: { type: 'string', format: 'binary' } },
            },
            StudentResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Student' },
                },
            },
            StudentListResponse: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Student' } },
                    message: { type: 'string', nullable: true },
                },
            },
            TeacherResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Teacher' },
                },
            },
            TeacherListResponse: {
                type: 'object',
                properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Teacher' } },
                    message: { type: 'string', nullable: true },
                },
            },
            CreateAdminRequest: {
                type: 'object',
                required: ['fullname', 'email', 'password', 'phone_number'],
                properties: {
                    fullname: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                    phone_number: { type: 'string' },
                    photo: { type: 'string', format: 'binary', nullable: true },
                },
            },
            UpdateAdminRequest: {
                type: 'object',
                properties: {
                    fullname: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone_number: { type: 'string' },
                },
            },
            Admin: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    fullname: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    phone_number: { type: 'string' },
                    photo_url: { type: 'string', nullable: true },
                    role: { type: 'string', enum: ['ADMIN'] },
                    is_active: { type: 'boolean' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            AdminResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Admin' },
                },
            },
        },
    },
};

export default swaggerDocument;
