HR Management Portal (React + Vite + FastAPI + PostgreSQL)

A full-stack HR Management Portal designed to streamline employee and HR workflows — including onboarding employees, leave management, document uploads, assigning projects, holidays management, expense management , and employee engagement tracking.
Built with React + Vite, FastAPI, and PostgreSQL, this app delivers speed, reliability, and scalability.


Key Features

1. For HR

Onboard new employeess, Documents Collection

View, approve, or reject leave applications

View, approve, or reject expense applications

Assign leave balances to employees

Track employee attendance and performance

2. Account Manager 

Add Projects 

View, approve, or reject expense applications

3. For Manager

Assign projects to employees

View, approve, or reject leave applications

View, approve, or reject expense applications

Track employee attendance and performance

4. For Employees

Apply for leaves, expense and track approval status

View company policies divided into interactive info sections

Access personal profile, leave balance, and HR announcements

Core Features

Secure login & authentication using JWT

FastAPI-based REST API with PostgreSQL integration

Responsive UI with modern design (Vite + Tailwind)

Centralized state management & API handling with Axios

Automatic email notifications for key HR events

Tech Stack

| Layer                     | Technology                                                  |
| ------------------------- | ----------------------------------------------------------- |
| Frontend                  | React (Vite), Axios, Tailwind CSS / ShadCN UI, Lucide Icons |
| Backend                   | FastAPI, SQLModel / SQLAlchemy                              |
| Database                  | PostgreSQL                                                  |
| Authentication            | JWT (OAuth2 Password Bearer)                                |
| Email Service             | Nodemailer (Gmail SMTP)                                     |
| Deployment (Optional)     | Docker, Render / Railway, Netlify / Vercel                  |

Setup Instructions
1. Clone the Repository
git clone https://github.com/saivaishnavthota/hrms.git

2. Backend Installations
pip install -r requirements.txt

3. Run database migrations (if using Alembic or SQLModel):
alembic upgrade head

4. Start the FastAPI server:
uvicorn main:app --reload

5. Frontend Setup (React + Vite) 
   Installations: npm install

Common Commands :

| Command                     | Description                       |
| --------------------------- | --------------------------------- |
| `npm run dev`               | Run React app in development mode |
| `uvicorn main:app --reload` | Start FastAPI backend             |
| `alembic upgrade head`      | Apply database migrations         |
| `npm run build`             | Build frontend for production     |
| `npm run preview`           | Preview production build          |

