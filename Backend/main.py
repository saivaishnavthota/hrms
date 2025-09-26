from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import create_tables_database
from routes import user_routes, document_routes,locations_routes, attendance_routes,leave_routes,onboarding_routes, calendar_routes,expenses_routes, project_routes, weekoff_routes, expense_management_routes
from middleware.cors import add_cors_middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables_database()
    yield

app = FastAPI(lifespan=lifespan)

# Allow frontend (React at localhost:5173) to talk to backend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Or ["*"] for all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#changed
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

add_cors_middleware(app)

app.include_router(user_routes.router)
app.include_router(document_routes.router) 
app.include_router(attendance_routes.router)
app.include_router(leave_routes.router)
app.include_router(expense_management_routes.router)
app.include_router(onboarding_routes.router)
app.include_router(locations_routes.router)
app.include_router(calendar_routes.router)
app.include_router(expenses_routes.router)
app.include_router(project_routes.router)
app.include_router(weekoff_routes.router)
