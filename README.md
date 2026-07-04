# Samarth College ERP System

## Educational ERP System for Samarth Rural Educational Institute
### SAMARTH COLLEGE OF ENGINEERING & MANAGEMENT, BELHE

A comprehensive full-stack Educational ERP System providing a centralized platform for managing academic, administrative, financial, library, and front-office operations — with role-based access for 8 different user types.

---

## 🌟 Features

### 👥 User Roles (8 Roles)
| Role | Description |
|------|-------------|
| 🛡️ **Super Admin** | Full system control — manage all users, roles, and modules |
| 👨‍💼 **Admin** | College administration — students, teachers, fees, reports |
| 👨‍🏫 **Teacher** | Attendance marking, marks entry, notes upload |
| 🎓 **Student** | View attendance, fees, marks, download study materials |
| 👨‍👩‍👧 **Parent** | Monitor ward's academic progress and fee status |
| 💰 **Accountant** | Manage income, expenses, fee collection, financial reports |
| 📚 **Librarian** | Book management, issue/return tracking, fine calculation |
| 🏢 **Receptionist** | Front office — visitors, inquiries, calls, complaints |

### 📦 Core Modules
- 📊 **Dashboards** — Role-specific dashboards with live analytics
- 📅 **Attendance Management** — Mark and track student attendance
- 💰 **Fee Management** — Fee structures, payments, receipts
- 📚 **Marks & Results** — Marks entry, grade calculation, result reports
- 📝 **Study Materials** — Upload and download notes and assignments
- 🏆 **Scholarships** — Manage and apply for scholarships
- 📋 **Leave Applications** — Apply and approve leave requests
- 🖼️ **College Gallery** — Manage campus images
- 📚 **Library Management** — Books, issue/return, overdue fines
- 🏢 **Front Office** — Visitor logs, admission inquiries, call records
- 💵 **Income & Expense Tracking** — Financial ledger management
- 🛡️ **User Management** — Create, disable, and manage all system users

### 🤖 AI & Agentic Features (NEW)
| Feature | Description |
|---------|-------------|
| 🤖 **Agentic ERP Chatbot (Sammy)** | Tool-calling LLM agent powered by Groq LLaMA-3.3-70b. Reads live ERP data (attendance, fees, marks, leaves, library) and responds with real numbers |
| 📊 **AI Insights Dashboard** | Admin/SuperAdmin panel that gathers live ERP data and generates a natural-language health report, anomaly alerts, and actionable recommendations via AI |
| 💬 **Smart Chat Widget** | Premium glassmorphism floating chat bubble on all dashboards with role-specific quick actions, typing animations, and tool-call indicators |

---

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** Authentication
- **Role-Based Access Control (RBAC)** — centralized `roles.js` config
- **Multer** for file uploads
- **PDFKit** for receipt generation
- **Bcrypt.js** for password hashing

### Frontend
- **React 18**
- **React Router v6** — protected, role-based routing
- **Chart.js / Recharts** for analytics
- **React Toastify** for notifications
- **React Icons** for UI icons
- **Modern CSS** with CSS Variables & dark-mode support

---

## 📁 Project Structure

```
ERP_system/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── roles.js            # RBAC — roles, modules, permissions
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── studentController.js
│   │   ├── teacherController.js
│   │   ├── superAdminController.js   # NEW
│   │   ├── accountantController.js   # NEW
│   │   ├── libraryController.js      # NEW
│   │   └── frontOfficeController.js  # NEW
│   ├── middleware/
│   │   ├── auth.js             # protect, authorize, checkPermission
│   │   ├── errorHandler.js     # asyncHandler, errorHandler
│   │   └── upload.js           # Multer file upload
│   ├── models/
│   │   ├── User.js             # 8 roles supported
│   │   ├── Student.js
│   │   ├── Teacher.js
│   │   ├── Parent.js
│   │   ├── Book.js             # NEW — Book + BookIssue
│   │   ├── FrontOffice.js      # NEW
│   │   ├── Income.js           # NEW
│   │   ├── Expense.js          # NEW
│   │   └── ...more
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── superAdminRoutes.js       # NEW
│   │   ├── libraryRoutes.js          # NEW
│   │   ├── frontOfficeRoutes.js      # NEW
│   │   └── accountantRoutes.js       # NEW
│   ├── seeders/
│   │   └── seedData.js         # Seeds all 8 role demo users
│   ├── uploads/                # Uploaded files
│   ├── server.js               # Express entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── DashboardLayout.js  # Role-based sidebar nav
│   │   │   │   └── MainLayout.js
│   │   │   └── ProtectedRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js          # Auth + dashboard routing
│   │   ├── pages/
│   │   │   ├── auth/           # Login page (8 role selectors)
│   │   │   ├── admin/          # Admin panel pages
│   │   │   ├── teacher/        # Teacher panel pages
│   │   │   ├── student/        # Student panel pages
│   │   │   ├── parent/         # Parent panel pages
│   │   │   ├── superadmin/     # NEW — Super Admin pages
│   │   │   ├── accountant/     # NEW — Accountant pages
│   │   │   ├── librarian/      # NEW — Librarian pages
│   │   │   └── receptionist/   # NEW — Receptionist pages
│   │   ├── services/
│   │   │   └── api.js          # All API service functions
│   │   ├── App.js              # Routes for all 8 role panels
│   │   └── index.css           # Global styles
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure environment — create a .env file:
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ERP_system
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

```bash
# Seed the database with all 8 demo users
node seeders/seedData.js

# Start backend server
npm run dev
```

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The web app will open at `http://localhost:3000`

---

## 🔐 Demo Login Credentials

> Use these after running the seeder (`node seeders/seedData.js`)

| Role | Email | Password |
|------|-------|----------|
| 🛡️ Super Admin | `superadmin@samarthcollege.edu.in` | `superadmin123` |
| 👨‍💼 Admin | `admin@samarthcollege.edu.in` | `admin123` |
| 👨‍🏫 Teacher | `teacher1@samarthcollege.edu.in` | `teacher123` |
| 🎓 Student | `student1@samarthcollege.edu.in` | `student123` |
| 👨‍👩‍👧 Parent | `parent1@gmail.com` | `parent123` |
| 💰 Accountant | `accountant@samarthcollege.edu.in` | `accountant123` |
| 📚 Librarian | `librarian@samarthcollege.edu.in` | `librarian123` |
| 🏢 Receptionist | `receptionist@samarthcollege.edu.in` | `receptionist123` |

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login user
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/profile` — Update profile

### Super Admin
- `GET /api/super-admin/dashboard` — System-wide analytics
- `GET /api/super-admin/users` — All users (filterable by role)
- `POST /api/super-admin/users` — Create user
- `PUT /api/super-admin/users/:id/role` — Change user role
- `PUT /api/super-admin/users/:id/status` — Toggle active/inactive
- `DELETE /api/super-admin/users/:id` — Delete user
- `GET /api/super-admin/roles` — RBAC config

### Library
- `GET /api/library/dashboard` — Library stats
- `GET /api/library/books` — All books
- `POST /api/library/books` — Add book
- `PUT /api/library/books/:id` — Update book
- `DELETE /api/library/books/:id` — Delete book
- `GET /api/library/issues` — All issue/return records
- `POST /api/library/issue` — Issue a book
- `PUT /api/library/return/:id` — Return a book

### Front Office
- `GET /api/front-office/dashboard` — Front office stats
- `GET /api/front-office` — All entries (filterable by type)
- `POST /api/front-office` — Create entry
- `PUT /api/front-office/:id/checkout` — Check out visitor
- `DELETE /api/front-office/:id` — Delete entry

### Accountant
- `GET /api/accountant/dashboard` — Financial dashboard
- `GET /api/accountant/income` — Income records
- `POST /api/accountant/income` — Add income
- `DELETE /api/accountant/income/:id` — Delete income
- `GET /api/accountant/expenses` — Expense records
- `POST /api/accountant/expenses` — Add expense
- `DELETE /api/accountant/expenses/:id` — Delete expense

### Students, Teachers, Attendance, Fees, Marks, Notes...
> See individual route files in `backend/routes/` for full endpoint list.

---

## 🚀 Deployment

### Web Application
- **Frontend:** Deploy to Vercel, Netlify, or Render
- **Backend:** Deploy to Render, Railway, or Heroku
- **Database:** MongoDB Atlas (recommended)

---

## 📄 License

This project is proprietary software for Samarth Rural Educational Institute.

---

## 👨‍💻 Developer

Built with ❤️ for **Samarth College of Engineering & Management, Belhe**

---

## 🤝 Support

For support, email: `support@samarthcollege.edu.in`

---

**⭐ Star this repository if you find it helpful!**
