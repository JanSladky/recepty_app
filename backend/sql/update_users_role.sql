-- 1) Přidáme nový sloupec role s výchozí hodnotou USER
ALTER TABLE users
  ADD COLUMN role TEXT NOT NULL DEFAULT 'USER';

-- 2) Přeneseme hodnoty ze starého sloupce is_admin
UPDATE users SET role = 'ADMIN' WHERE is_admin = true;

-- 3) Nastavíme tebe jako SUPERADMINA (změň email na svůj)
UPDATE users SET role = 'SUPERADMIN' WHERE email = 'tvuj@email.cz';

-- 4) Odstraníme starý sloupec is_admin (už ho nepotřebujeme)
ALTER TABLE users DROP COLUMN is_admin;

-- 5) Přidáme kontrolu platných hodnot
ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('SUPERADMIN','ADMIN','USER'));