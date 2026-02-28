-- إنشاء مستخدم وقاعدة بيانات UniPilot
-- غيّر كلمة المرور 'UniPilot123' لو حاب

CREATE USER unipilot_user WITH PASSWORD 'UniPilot123';
CREATE DATABASE unipilot OWNER unipilot_user;
