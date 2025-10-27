@echo off
echo Starting HRMS Local Development (Simple Version)...

echo Starting services with docker-compose.local-simple.yml...
echo.

docker-compose -f docker-compose.local-simple.yml up --build

pause
