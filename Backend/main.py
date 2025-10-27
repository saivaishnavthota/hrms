from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import create_tables_database
from routes import user_routes, document_routes,locations_routes, attendance_routes,leave_routes,onboarding_routes, calendar_routes,expenses_routes, project_routes, expense_management_routes, policy_routes, hr_config_routes,asset_routes, swreq_routes, entra_auth_routes, project_allocation_routes, employee_import_routes
from middleware.cors import add_cors_middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from fastapi import FastAPI
import os
from dotenv import load_dotenv
load_dotenv()
PORT=int(os.getenv("PORT", 2343))

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables_database()
    yield

app = FastAPI(lifespan=lifespan, redirect_slashes=False)

# Allow frontend (React at localhost:5173) to talk to backend
# Get CORS origins from environment or use defaults
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    origins = cors_origins_env.split(",")
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:2343",
        "http://127.0.0.1:2343",
        # Include alternate dev ports to avoid CORS during local testing
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://react_app",  # Add this - Docker container name
        "http://react_app:80",
        # Production deployment origins
        "https://149.102.158.71",
        "https://149.102.158.71:443",
        "http://149.102.158.71:2343",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# CORS middleware already added above; avoid adding twice

app.include_router(user_routes.router)
app.include_router(document_routes.router) 
app.include_router(attendance_routes.router)
app.include_router(leave_routes.router)

app.include_router(onboarding_routes.router)
app.include_router(locations_routes.router)
app.include_router(calendar_routes.router)
app.include_router(expenses_routes.router)
app.include_router(project_routes.router)
app.include_router(policy_routes.router)
app.include_router(hr_config_routes.router)

app.include_router(asset_routes.router)
app.include_router(swreq_routes.router)
app.include_router(entra_auth_routes.router)
app.include_router(entra_auth_routes.oauth2_router)  # Azure AD standard OAuth2 redirect path
app.include_router(project_allocation_routes.router)
app.include_router(employee_import_routes.router)

# Add static file serving for uploads
import os
uploads_path = os.path.join(os.getcwd(), "uploads")
if os.path.exists(uploads_path):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
    print(f"Static files mounted at /uploads from {uploads_path}")
else:
    print(f"Warning: Uploads directory not found at {uploads_path}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)