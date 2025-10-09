# HRMS - Human Resource Management System

A comprehensive full-stack HR Management System designed to streamline employee lifecycle management, leave tracking, expense management, attendance monitoring, and HR workflows. Built with modern technologies for scalability, security, and performance.

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
  - [1. Clone Repository](#1-clone-the-repository)
  - [2. Database Setup](#2-database-setup)
  - [3. Backend Setup](#3-backend-setup)
  - [4. Frontend Setup](#4-frontend-setup)
- [Environment Variables](#-environment-variables)
- [Database Migrations](#-database-migrations)
- [Running the Application](#-running-the-application)
- [Recent Updates](#-recent-updates)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Role-Based Access Control

#### For HR Personnel
- **Employee Onboarding**: Streamlined onboarding workflow with document collection
- **Leave Management**: View, approve, or reject leave applications
- **Expense Management**: Review and approve expense requests with tax calculations
- **Leave Balance Assignment**: Allocate and manage leave balances for employees
- **Attendance Tracking**: Monitor employee attendance and generate reports
- **Super HR Features**: View all employees across organization (Super HR only)
- **Document Management**: Collect and verify employee documents
- **Company Policies**: Upload and manage company policies by location

#### For Account Manager
- **Project Management**: Create and manage projects
- **Expense Approval**: Final approval for expense requests
- **Financial Oversight**: Review expenses with detailed tax and discount breakdowns
- **Location-Based Access**: Manage expenses for employees in the same location

#### For Managers
- **Team Management**: Assign projects to team members
- **Leave Approval**: Review and approve/reject team leave requests
- **Expense Review**: Approve expense requests from team members
- **Performance Tracking**: Monitor team attendance and performance
- **Expense Submission**: Submit personal expenses with tax calculations

#### For Employees
- **Leave Application**: Apply for leaves with automatic holiday/weekoff exclusion
- **Expense Submission**: Submit expenses with discount, CGST, and SGST calculations
- **Attendance Management**: Mark daily attendance with project allocation
- **Document Upload**: Upload required documents during onboarding
- **Company Policies**: View company policies with interactive sections
- **Profile Management**: Access personal information and leave balances
- **Status Tracking**: Track approval status for leaves and expenses

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Modern, fast UI with hot module replacement |
| **UI Library** | Tailwind CSS + ShadCN UI | Responsive, accessible component library |
| **Icons** | Lucide React | Beautiful, consistent icon set |
| **Backend** | FastAPI | High-performance Python async API framework |
| **ORM** | SQLModel + SQLAlchemy | Type-safe database operations |
| **Database** | PostgreSQL 14+ | Robust relational database |
| **Authentication** | JWT (OAuth2 Password Bearer) | Secure token-based authentication |
| **Session Management** | Redis | Fast session storage and caching |
| **Email Service** | SMTP (Gmail) | Automated email notifications |
| **File Storage** | Azure Blob Storage | Cloud-based file storage for documents |
| **Migrations** | Alembic | Database version control |
| **API Client** | Axios | Promise-based HTTP client |

---

## 📦 Prerequisites

Before setting up the project, ensure you have the following installed:

### Required Software

1. **Python** `3.11+`
   - Download: https://www.python.org/downloads/
   - Verify: `python --version`

2. **Node.js** `18.x+` and **npm** `9.x+`
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

3. **PostgreSQL** `14+`
   - Download: https://www.postgresql.org/download/
   - Verify: `psql --version`

4. **Redis** (Optional but recommended for sessions)
   - Download: https://redis.io/download
   - Windows: https://github.com/microsoftarchive/redis/releases
   - Verify: `redis-cli --version`

5. **Git**
   - Download: https://git-scm.com/downloads
   - Verify: `git --version`

### Optional Tools

- **pgAdmin 4**: GUI for PostgreSQL database management
- **Postman**: API testing and documentation
- **VS Code**: Recommended code editor with extensions:
  - Python
  - ESLint
  - Prettier
  - PostgreSQL

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/saivaishnavthota/hrms.git
cd hrms
```

---

### 2. Database Setup

#### Step 1: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hrms_db;

# Create user (optional)
CREATE USER hrms_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hrms_db TO hrms_user;

# Exit psql
\q
```

#### Step 2: Run Schema (For Fresh Installation)

```bash
# Option A: Run the complete schema file
psql -U postgres -d hrms_db -f expattendance.sql

# Option B: Use Alembic migrations (recommended for development)
# See Database Migrations section below
```

---

### 3. Backend Setup

#### Step 1: Navigate to Backend Directory

```bash
cd Backend
```

#### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 4: Create Environment File

Create a `.env` file in the `Backend` directory:

```bash
# Copy example env file
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#-environment-variables) section)

#### Step 5: Run Database Migrations

```bash
# Apply all migrations
alembic upgrade head

# Check migration status
alembic current
```

#### Step 6: Start Backend Server

```bash
# Development mode with hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Backend will be available at: http://localhost:8000

API Documentation: http://localhost:8000/docs

---

### 4. Frontend Setup

#### Step 1: Navigate to Frontend Directory

```bash
# From project root
cd Frontend
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Create Environment File

Create a `.env` file in the `Frontend` directory:

```bash
# Copy example env file (if available)
cp .env.example .env
```

Add the following:

```env
VITE_API_BASE_URL=http://localhost:8000
```

#### Step 4: Start Development Server

```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

#### Step 5: Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

---

## 🔐 Environment Variables

### Backend `.env` File

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hrms_db

# JWT Secret (Generate using: openssl rand -hex 32)
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@yourcompany.com

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Azure Blob Storage (for file uploads)
AZURE_CONNECTION_STRING=your_azure_connection_string
AZURE_CONTAINER_NAME=con-hrms
ACCOUNT_NAME=your_storage_account_name
ACCOUNT_KEY=your_storage_account_key

# Application Settings
DEBUG=True
CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend `.env` File

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Optional: Analytics, etc.
# VITE_GA_TRACKING_ID=your-ga-id
```

---

## 🗃 Database Migrations

### Using Alembic for Database Version Control

#### Check Current Migration Status

```bash
cd Backend
alembic current
```

#### View Migration History

```bash
alembic history
```

#### Apply All Pending Migrations

```bash
alembic upgrade head
```

#### Apply Specific Migration

```bash
# Upgrade to specific revision
alembic upgrade 009_add_expense_discount_tax

# Downgrade to specific revision
alembic downgrade 008_add_super_hr
```

#### Create New Migration

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "description of changes"

# Create empty migration
alembic revision -m "description of changes"
```

#### Rollback Migration

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Rollback all migrations
alembic downgrade base
```

### Migration Sequence

Current migrations (in order):
1. `001_initial_migration` - Base schema
2. `002_postgresql_functions_triggers_procedures` - Stored procedures
3. `003_add_company_employee_id` - Employee ID tracking
4. `004_remove_reassignment_field` - Schema cleanup
5. `005_fix_expense_attachments_url` - File storage updates
6. `006_add_deleted_at_to_expense_requests` - Soft deletes
7. `007_create_company_policies_table` - Policy management
8. `008_add_super_hr_field` - Super HR role
9. `009_add_expense_discount_tax_fields` - Expense tax calculations

---

## ▶️ Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd Backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

**Terminal 3 - Redis (if using):**
```bash
redis-server
```

### Production Mode

**Backend:**
```bash
cd Backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Frontend:**
```bash
cd Frontend
npm run build
# Serve build folder with nginx or serve
npx serve -s dist
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

---

## 🆕 Recent Updates

### Version 1.5.0 (January 2025)

#### Expense Management Enhancements
- ✅ **Tax & Discount Calculations**: Added CGST, SGST, and discount percentage fields
- ✅ **Final Amount Calculation**: Automatic calculation of final expense amount
- ✅ **Enhanced Forms**: Manager and HR can now add expenses with full tax details
- ✅ **Detailed Breakdown**: View complete tax and discount breakdown in expense details
- ✅ **All Roles Updated**: Manager, HR, Account Manager, and Employee forms updated

#### Super HR Feature
- ✅ **Super HR Role**: Elevated HR permissions to view all employees
- ✅ **Regular HR**: Restricted to assigned employees only
- ✅ **Filter Capability**: Super HR can filter by specific HR

#### UI/UX Improvements
- ✅ **Status Display**: Clean status formatting (removed underscores)
- ✅ **Responsive Tax Forms**: Conditional display of tax/discount fields
- ✅ **Consistent Design**: Blue-themed panels across all components

#### Database Schema Updates
- ✅ **New Fields**: `discount_percentage`, `cgst_percentage`, `sgst_percentage`, `final_amount`
- ✅ **Migration 009**: Add expense discount and tax fields
- ✅ **Backward Compatible**: Existing expenses auto-set with default values

---

## 📚 API Documentation

### Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
- `POST /users/login` - User login
- `POST /users/forgot-password` - Password reset request
- `POST /users/reset-password` - Reset password with OTP

#### Employee Management
- `GET /users/employees` - List employees (HR/Manager)
- `POST /users/employees` - Create employee
- `PUT /users/employees/{id}` - Update employee
- `GET /users/onboarded-employees/{id}/documents` - Get employee documents

#### Leave Management
- `POST /leave/apply_leave` - Apply for leave
- `GET /leave/all_leaves/{employee_id}` - Get employee leaves
- `GET /leave/manager/leave-requests/{manager_id}` - Manager's pending leaves
- `POST /leave/manager/leave-action/{leave_id}` - Manager approval/rejection
- `GET /leave/hr/pending-leaves/{hr_id}` - HR's pending leaves
- `POST /leave/hr/leave-action/{leave_id}` - HR approval/rejection
- `GET /leave/leave_balances/{employee_id}` - Get leave balances
- `PUT /leave/leave-balance/{employee_id}` - Update leave balance

#### Expense Management
- `POST /expenses/submit-exp` - Submit expense with tax/discount
- `GET /expenses/my-expenses` - Employee's expenses
- `GET /expenses/mgr-exp-list` - Manager's expense list
- `PUT /expenses/mgr-upd-status/{request_id}` - Manager approval
- `GET /expenses/hr-exp-list` - HR's expense list
- `PUT /expenses/hr-upd-status/{request_id}` - HR approval
- `GET /expenses/acc-mgr-exp-list` - Account Manager's expense list
- `PUT /expenses/acc-mgr-upd-status/{request_id}` - Account Manager approval

#### Attendance
- `POST /attendance/save` - Save attendance
- `GET /attendance/employee/{employee_id}` - Get employee attendance
- `GET /attendance/manager/{manager_id}` - Get team attendance

---

## 📁 Project Structure

```
hrms/
├── Backend/
│   ├── alembic/                 # Database migrations
│   │   └── versions/            # Migration files
│   ├── models/                  # SQLModel database models
│   │   ├── user_model.py
│   │   ├── leave_model.py
│   │   ├── expenses_model.py
│   │   └── ...
│   ├── routes/                  # API route handlers
│   │   ├── user_routes.py
│   │   ├── leave_routes.py
│   │   ├── expenses_routes.py
│   │   └── ...
│   ├── schemas/                 # Pydantic schemas
│   │   ├── user_schema.py
│   │   ├── leave_schema.py
│   │   └── ...
│   ├── utils/                   # Utility functions
│   │   ├── email.py
│   │   ├── hash_utils.py
│   │   └── ...
│   ├── auth.py                  # Authentication logic
│   ├── database.py              # Database connection
│   ├── main.py                  # FastAPI app entry point
│   └── requirements.txt         # Python dependencies
│
├── Frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Employee/
│   │   │   ├── Manager/
│   │   │   ├── HR/
│   │   │   ├── AccountManager/
│   │   │   ├── layouts/
│   │   │   └── ui/              # ShadCN UI components
│   │   ├── contexts/            # React contexts
│   │   ├── lib/                 # Utilities and helpers
│   │   ├── pages/               # Page components
│   │   ├── routing/             # Route configuration
│   │   ├── App.jsx              # Root component
│   │   └── main.jsx             # Entry point
│   ├── .env                     # Environment variables
│   ├── package.json             # npm dependencies
│   └── vite.config.js           # Vite configuration
│
├── expattendance.sql            # Complete database schema
├── SCHEMA_UPDATE_SUMMARY.md     # Database changes documentation
├── README.md                    # This file
└── requirements.txt             # Root-level Python deps
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Error

**Error**: `FATAL: password authentication failed`

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Verify credentials in .env file
# Ensure DATABASE_URL is correct

# Reset PostgreSQL password if needed
psql -U postgres
ALTER USER postgres PASSWORD 'newpassword';
```

#### 2. Migration Fails

**Error**: `Target database is not up to date`

**Solution**:
```bash
# Check current revision
alembic current

# Stamp the database with current revision
alembic stamp head

# Try upgrade again
alembic upgrade head
```

#### 3. Frontend Can't Connect to Backend

**Error**: `Network Error` or `CORS Error`

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/docs`
2. Check `VITE_API_BASE_URL` in Frontend/.env
3. Verify CORS settings in Backend main.py
4. Clear browser cache and restart dev server

#### 4. Redis Connection Error

**Error**: `Error connecting to Redis`

**Solution**:
```bash
# Start Redis server
redis-server

# Or disable Redis in code (session_utils.py)
# Comment out Redis-related code
```

#### 5. Email Not Sending

**Error**: `Authentication failed` or `SMTP Error`

**Solution**:
1. Enable "Less secure app access" in Gmail (not recommended)
2. **Recommended**: Use App-Specific Password:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password
   - Use that password in .env

#### 6. File Upload Fails

**Error**: `Azure Blob Storage error`

**Solution**:
1. Verify Azure credentials in .env
2. Check container exists and has correct permissions
3. Alternative: Switch to local file storage temporarily

#### 7. npm Install Fails

**Error**: `ERESOLVE unable to resolve dependency tree`

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install with legacy peer deps
npm install --legacy-peer-deps
```

---

## 🧪 Testing

### Backend Tests

```bash
cd Backend
pytest
```

### Frontend Tests

```bash
cd Frontend
npm run test
```

### API Testing with Postman

1. Import API collection from `/docs` endpoint
2. Set environment variables
3. Test endpoints

---

## 📊 Common Commands Reference

| Command | Description |
|---------|-------------|
| **Backend** |
| `uvicorn main:app --reload` | Start backend dev server |
| `alembic upgrade head` | Apply all migrations |
| `alembic downgrade -1` | Rollback one migration |
| `alembic history` | View migration history |
| `pytest` | Run backend tests |
| **Frontend** |
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| **Database** |
| `psql -U postgres -d hrms_db` | Connect to database |
| `pg_dump hrms_db > backup.sql` | Backup database |
| `psql -U postgres hrms_db < backup.sql` | Restore database |
| **Git** |
| `git status` | Check repository status |
| `git add .` | Stage all changes |
| `git commit -m "message"` | Commit changes |
| `git push origin main` | Push to remote |

---

## 👥 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make Your Changes**
   - Follow existing code style
   - Add comments where necessary
   - Update documentation
4. **Test Your Changes**
   ```bash
   pytest  # Backend
   npm test  # Frontend
   ```
5. **Commit Your Changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to Your Fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Create Pull Request**

### Code Style

- **Python**: Follow PEP 8
- **JavaScript**: Follow Airbnb Style Guide
- **Commits**: Use conventional commits format

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- FastAPI for the excellent Python web framework
- React team for the amazing frontend library
- ShadCN for beautiful UI components
- PostgreSQL for robust database system
- All contributors and users of this project

---

## 📞 Support

For support, please:
- 📧 Email: support@yourcompany.com
- 🐛 Open an issue on GitHub
- 💬 Join our Discord community
- 📖 Read the documentation

---

## 🚀 Deployment

### Using Docker (Recommended)

```bash
# Build and run with docker-compose
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

### Manual Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- AWS EC2
- Heroku
- Railway
- Render
- DigitalOcean

---

**Made with ❤️ by the HRMS Team**

*Last Updated: January 2025*
