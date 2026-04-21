-- Run only if haircut_db doesn't exist
SELECT 'CREATE DATABASE haircut_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'haircut_db')\gexec
ALTER USER postgres WITH PASSWORD '04012006';
