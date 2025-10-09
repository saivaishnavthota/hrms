@echo off
echo 🚀 Setting up HR Config Database Tables...
echo.

REM Run the migration
echo 📦 Running database migration...
alembic upgrade head

if %errorlevel% equ 0 (
    echo ✅ Migration completed successfully!
    echo.
    echo 🎉 Setup complete! Now restart your backend server.
    echo.
    echo To start the backend, run:
    echo   python main.py
    echo.
) else (
    echo ❌ Migration failed. Please check the error above.
    exit /b 1
)

