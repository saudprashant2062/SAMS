# SAMS Frontend - Student Attendance Management System

A modern, responsive React frontend for the Student Attendance Management System, built with React 19, Vite, Redux Toolkit, Material-UI, and Tailwind CSS.

## 🚀 Overview

The SAMS Frontend provides a complete user interface for administrators, teachers, and students to manage and view attendance records. It features a role-based system where each user type has access to specific functionalities tailored to their needs.

### Key Features

- **Role-Based Access**: Separate dashboards and interfaces for Admin, Teacher, and Student roles
- **Modern UI/UX**: Beautiful, responsive interface with Material-UI components and Tailwind styling
- **Real-time Updates**: Optimized data fetching with React Query
- **State Management**: Efficient state management with Redux Toolkit
- **Form Validation**: Client-side validation with Zod schemas
- **Responsive Design**: Mobile-first approach for all screen sizes
- **Error Handling**: Comprehensive error handling with toast notifications
- **Loading States**: Smooth loading indicators and skeleton screens

## 🛠️ Technology Stack

### Core Technologies

- **React**: 19.2.0 - Modern UI library
- **Vite**: 7.2.4 - Fast build tool and dev server
- **Redux Toolkit**: 2.11.2 - State management
- **React Router DOM**: 7.12.0 - Client-side routing

### UI & Styling

- **Material-UI (MUI)**: 7.3.7 - Comprehensive UI component library
- **Tailwind CSS**: 4.1.18 - Utility-first CSS framework
- **@emotion/react & @emotion/styled**: 11.14.0 - CSS-in-JS styling
- **React Icons**: 5.5.0 - Icon library

### Data Fetching & State

- **@tanstack/react-query**: 5.90.19 - Server state management
- **Axios**: 1.13.2 - HTTP client

### Form Handling & Validation

- **Zod**: 4.3.6 - Schema validation

## 📁 Project Structure

```
SAMS_FRONTEND/
├── public/                          # Static assets
│   └── Academia.png                 # Academy logo
├── src/
│   ├── api/                         # API integration layer
│   │   ├── admin.api.js            # Admin-specific API calls
│   │   ├── assignment.api.js       # Assignment-related APIs
│   │   ├── attendance.api.js       # Attendance-related APIs
│   │   ├── auth.api.js             # Authentication APIs
│   │   ├── axiosInstance.js        # Axios instance configuration
│   │   ├── index.js                # API exports
│   │   ├── student.api.js          # Student-specific APIs
│   │   └── teacher.api.js          # Teacher-specific APIs
│   │
│   ├── app/store/                  # Redux store configuration
│   │   ├── index.js                # Store configuration
│   │   └── rootReducer.js          # Root reducer combining all slices
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── attendance/             # Attendance-specific components
│   │   │   ├── AttendanceHeader.jsx
│   │   │   └── StudentRow.jsx
│   │   └── common/                 # Common/shared components
│   │       ├── AlertMessage.jsx    # Alert/toast notifications
│   │       ├── Button.jsx          # Reusable button component
│   │       ├── ConfirmModal.jsx    # Confirmation dialog
│   │       ├── Input.jsx           # Reusable input component
│   │       ├── Loader.jsx          # Loading spinner
│   │       └── Table.jsx           # Reusable table component
│   │
│   ├── features/                   # Redux slices (state management)
│   │   ├── assignment/             # Assignment state
│   │   │   ├── assignment.selectors.js
│   │   │   └── assignment.slice.js
│   │   ├── attendance/             # Attendance state
│   │   │   ├── attendance.selectors.js
│   │   │   └── attendance.slice.js
│   │   ├── auth/                   # Authentication state
│   │   │   ├── auth.selector.js
│   │   │   └── auth.slice.js
│   │   └── ui/                     # UI state
│   │       ├── ui.selectors.js
│   │       └── ui.slice.js
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useAuth.js              # Authentication-related logic
│   │   ├── useFetch.js             # Data fetching hook
│   │   └── useFormValidation.js    # Form validation hook
│   │
│   ├── layouts/                    # Page layouts based on role
│   │   ├── AdminLayout.jsx         # Admin dashboard layout
│   │   ├── AuthLayout.jsx          # Authentication pages layout
│   │   ├── StudentLayout.jsx       # Student dashboard layout
│   │   └── TeacherLayout.jsx       # Teacher dashboard layout
│   │
│   ├── pages/                      # Page components
│   │   ├── admin/                  # Admin pages
│   │   │   ├── ActivityLogs.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Batches.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DepartmentDetail.jsx
│   │   │   ├── Departments.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── SectionDetail.jsx
│   │   │   ├── Sections.jsx
│   │   │   ├── SemesterDetail.jsx
│   │   │   ├── Semesters.jsx
│   │   │   ├── SubjectDetail.jsx
│   │   │   ├── Subjects.jsx
│   │   │   ├── TeachingAssignments.jsx
│   │   │   ├── UserDetail.jsx
│   │   │   ├── UserEdit.jsx
│   │   │   └── Users.jsx
│   │   ├── auth/                   # Authentication pages
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Login.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── shared/                 # Shared pages
│   │   │   ├── ChangePassword.jsx
│   │   │   └── Profile.jsx
│   │   ├── student/                # Student pages
│   │   │   ├── Attendance.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Subjects.jsx
│   │   └── teacher/                # Teacher pages
│   │       ├── Assignments.jsx
│   │       ├── Attendance.jsx
│   │       └── Dashboard.jsx
│   │
│   ├── routes/                     # Application routing
│   │   ├── AppRoutes.jsx           # Main router configuration
│   │   ├── ProtectedRoute.jsx      # Protected route wrapper
│   │   └── RoleRoute.jsx           # Role-based route guard
│   │
│   ├── schemas/                    # Form validation schemas
│   │   ├── admin.schema.js
│   │   ├── attendance.schema.js
│   │   ├── auth.schema.js
│   │   └── forgotPassword.schema.js
│   │
│   ├── utils/                      # Utility functions
│   │   ├── constants.js            # Application constants
│   │   ├── formatDate.js           # Date formatting utilities
│   │   └── roleRedirect.js         # Role-based redirect logic
│   │
│   ├── App.jsx                     # Root application component
│   ├── index.css                   # Global styles
│   └── main.jsx                    # Application entry point
│
├── index.html                      # HTML template
├── package.json                    # Project dependencies
├── vite.config.js                  # Vite configuration
├── eslint.config.js                # ESLint configuration
└── README.md                       # This file
```

## 🎨 Role-Based Interfaces

### 🅰️ Administrator Dashboard

The admin dashboard provides comprehensive access to all system features:

```
Admin Layout Structure:
├── Sidebar Navigation
│   ├── Dashboard           → Overview & statistics
│   ├── Users              → User management (CRUD)
│   ├── Departments        → Department management
│   ├── Semesters          → Semester management
│   ├── Sections           → Section management
│   ├── Subjects           → Subject management
│   ├── Batches            → Batch management
│   ├── Teaching Assignments → Assign teachers to subjects
│   ├── Attendance         → View/manage all attendance
│   ├── Reports            → Generate attendance reports
│   ├── Activity Logs      → View system activity
│   ├── Profile            → User profile
│   └── Change Password    → Password management
│
└── Header
    ├── User info
    ├── Notifications
    └── Logout
```

**Admin Features:**

- 📊 Dashboard with key statistics and charts
- 👥 Complete user management (view, create, edit, delete, activate/deactivate)
- 📚 Academic structure management (departments, semesters, sections, subjects)
- 🎓 Teaching assignment management
- 📝 Bulk user creation via CSV upload
- 📋 Attendance management for all sessions
- 📈 Generate and export attendance reports
- 📜 View activity logs for audit trail
- 🔐 Password reset for users

### 👨‍🏫 Teacher Dashboard

The teacher dashboard focuses on teaching-related activities:

```
Teacher Layout Structure:
├── Sidebar Navigation
│   ├── Dashboard           → Teaching overview
│   ├── Assignments        → View assigned courses
│   ├── Attendance        → Mark & view attendance
│   ├── Profile           → User profile
│   └── Change Password   → Password management
│
└── Header
    ├── User info
    └── Logout
```

**Teacher Features:**

- 📊 Dashboard showing assigned courses and upcoming sessions
- 📚 View assigned teaching assignments
- 📝 Create and manage attendance sessions
- ✅ Mark student attendance (present/absent)
- 📋 View attendance reports for assigned classes
- 👤 Profile management

### 👨‍🎓 Student Dashboard

The student dashboard provides self-service features:

```
Student Layout Structure:
├── Sidebar Navigation
│   ├── Dashboard         → Personal overview
│   ├── Attendance       → View attendance records
│   ├── Subjects         → Enrolled subjects
│   ├── Profile          → User profile
│   └── Change Password  → Password management
│
└── Header
    ├── User info
    └── Logout
```

**Student Features:**

- 📊 Dashboard with attendance overview
- 📋 View personal attendance records
- 📚 View enrolled subjects
- 📈 Attendance percentage summaries
- 👤 Profile management

## 🔐 Authentication Flow

```
1. User visits /login
2. Enters credentials
3. API validates and returns tokens
4. Tokens stored in localStorage
5. Redux state updated with user data
6. User redirected based on role:
   - Admin → /admin/dashboard
   - Teacher → /teacher/dashboard
   - Student → /student/dashboard
```

### Token Management

- **Access Token**: Short-lived token for API requests
- **Refresh Token**: Long-lived token to get new access tokens
- **Auto-Refresh**: Automatically refreshes expired tokens
- **Secure Storage**: Tokens stored in localStorage

## 📡 API Integration

### Axios Configuration

The API layer is configured with:

- Base URL from environment variables
- Automatic token injection
- Request/response interceptors
- Error handling
- Timeout configuration

### API Modules

#### Authentication API (`auth.api.js`)

```javascript
-login(credentials) - // User login
  logout() - // User logout
  refreshToken() - // Refresh access token
  getMe() - // Get current user profile
  changePassword(data) - // Change password
  forgotPassword(email) - // Request password reset
  resetPassword(token, data); // Reset password with token
```

#### Admin API (`admin.api.js`)

```javascript
// Users
- getUsers(params)           // List users with filters
- getUser(id)               // Get single user
- createUser(data)          // Create user
- updateUser(id, data)      // Update user
- deleteUser(id)            // Soft delete user
- activateUser(id)          // Activate user
- deactivateUser(id)        // Deactivate user

// Departments, Semesters, Sections, Subjects, etc.
- CRUD operations for all academic entities
```

#### Attendance API (`attendance.api.js`)

```javascript
-getSessions(params) - // List attendance sessions
  getSession(id) - // Get session details
  createSession(data) - // Create new session
  markAttendance(data) - // Mark student attendance
  getAttendance(params); // Get attendance records
```

#### Student API (`student.api.js`)

```javascript
-getMyAttendance(params) - // Get personal attendance
  getMySubjects() - // Get enrolled subjects
  getMyProfile(); // Get personal profile
```

#### Teacher API (`teacher.api.js`)

```javascript
-getMyAssignments() - // Get assigned courses
  getMyAttendance(params) - // Get attendance for classes
  createSession(data) - // Create attendance session
  markAttendance(data); // Mark attendance for students
```

## 🪝 Custom Hooks

### `useAuth()`

Provides authentication-related functionality:

- Current user information
- Authentication state
- Login/logout methods
- Role checking

### `useFetch(options)`

Custom data fetching hook:

- Automatic loading states
- Error handling
- Data caching
- Refetch capabilities

### `useFormValidation(schema)`

Form validation hook:

- Zod schema validation
- Field-level validation
- Error messages
- Form state management

## 🧩 Components

### Common Components

#### Button

Reusable button component with variants:

- Primary
- Secondary
- Outlined
- Text
- Loading state

#### Input

Form input with:

- Label
- Error handling
- Helper text
- Validation states

#### Table

Data table with:

- Sorting
- Pagination
- Custom rendering
- Loading states

#### AlertMessage

Toast notifications for:

- Success messages
- Error messages
- Warning messages
- Info messages

#### ConfirmModal

Confirmation dialog for:

- Delete operations
- Destructive actions
- User confirmations

#### Loader

Loading indicators with:

- Spinner
- Progress bar
- Skeleton screens

### Attendance Components

#### AttendanceHeader

Header component for attendance pages showing:

- Date
- Session info
- Action buttons

#### StudentRow

Individual student row in attendance list with:

- Student info
- Attendance toggle
- Status indicator

## 🎯 State Management

### Redux Store Structure

```
store/
└── rootReducer.js
    ├── auth              // Authentication state
    │   └── user, isAuthenticated, accessToken
    ├── attendance        // Attendance state
    │   └── sessions, records, loading
    ├── assignment        // Assignment state
    │   └── assignments, loading
    └── ui                // UI state
        └── sidebarOpen, theme, notifications
```

### Key State Slices

#### Auth Slice

- `user`: Current user object
- `isAuthenticated`: Boolean flag
- `accessToken`: JWT access token

#### Attendance Slice

- `sessions`: List of attendance sessions
- `records`: Attendance records
- `loading`: Loading states
- `error`: Error messages

#### UI Slice

- `sidebarOpen`: Sidebar visibility
- `theme`: Theme mode
- `notifications`: Toast notifications

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Features

- Collapsible sidebar
- Touch-friendly interactions
- Optimized layouts for small screens
- Responsive tables with horizontal scroll

## 🎨 Theming

### CSS Variables

The application uses CSS variables for theming:

```css
:root {
  --primary: #1976d2;
  --secondary: #dc004e;
  --background: #f5f5f5;
  --surface: #ffffff;
  --text-primary: #212121;
  --text-secondary: #757575;
  --error: #f44336;
  --success: #4caf50;
  --warning: #ff9800;
}
```

### Tailwind Integration

Tailwind CSS v4 is configured with:

- Custom color palette
- Responsive utilities
- Custom components
- Utility classes

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend root:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Optional: API Timeout
VITE_API_TIMEOUT=30000
```

### Vite Configuration

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
```

## 📦 Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run dev -- --host  # Expose to network
```

### Building

```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Linting

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend server running

### Installation

1. **Clone the repository**

   ```bash
   cd SAMS
   cd SAMS_FRONTEND
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment**

   ```bash
   # Create .env file
   echo "VITE_API_URL=http://localhost:5000/api" > .env
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:5173
   - Login with your credentials

## 🔒 Security Best Practices

- Tokens stored in localStorage (consider httpOnly cookies for enhanced security)
- Auto-logout on token expiration
- Protected routes with authentication checks
- Role-based route guards
- Input validation on all forms
- CSRF protection via SameSite attribute

## 📈 Performance Optimizations

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo, useMemo, useCallback
- **Image Optimization**: Compressed and optimized images
- **Bundle Analysis**: Monitor bundle size
- **Caching**: React Query caching strategies

## 🧪 Testing

### Running Tests

```bash
npm run test         # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Test Coverage

- Unit tests for components
- Integration tests for API calls
- E2E tests for critical flows

## 🐛 Debugging

### React DevTools

Install React DevTools browser extension for:

- Component inspection
- State visualization
- Profiler analysis

### Redux DevTools

Install Redux DevTools for:

- Action monitoring
- State inspection
- Time-travel debugging

## 📚 Resources

### Documentation

- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React Router Documentation](https://reactrouter.com/)
- [TanStack Query Documentation](https://tanstack.com/query/)

### Learning Resources

- Component library examples
- State management patterns
- Form handling best practices
- API integration patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## 📄 License

ISC License - see the main repository for details.

## 👨‍💻 Authors

- **Aryan Saud** - Primary Developer
- **Safal Shyangwa** - Primary Developer

---

Built with ❤️ using React, Material-UI, and Tailwind CSS

For backend documentation, see: [Backend README](../student-attendance-management-system/README.md)
For root documentation, see: [Root README](../README.md)
