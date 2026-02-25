@echo off
echo ========================================
echo   UniPilot - PostgreSQL setup
echo ========================================
echo.

set /p PGPASSWORD="Enter postgres user password: "

echo.
echo Creating database and user...
echo.

psql -U postgres -f server\setup-db.sql

if errorlevel 1 (
  echo.
  echo Failed. Check: PostgreSQL is running and psql is in PATH.
  echo Or run from: "C:\Program Files\PostgreSQL\16\bin\psql" -U postgres -f server\setup-db.sql
  echo.
  pause
  exit /b 1
)

echo.
echo Done. Add to .env file:
echo   DATABASE_URL=postgresql://unipilot_user:UniPilot123@localhost:5432/unipilot
echo.
pause
