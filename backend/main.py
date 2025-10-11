from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import create_tables_database
from routes import asset_route, emp_route
from middleware.cors import add_cors_middleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables_database()
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(emp_route.router)
app.include_router(asset_route.router)

add_cors_middleware(app)