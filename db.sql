
CREATE TABLE tbl_users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
	username VARCHAR(50) UNIQUE NOT NULL,
	user_age INT,
	password TEXT NOT NULL,
    email VARCHAR(100) UNIQUE,
	phone VARCHAR(11),
	role VARCHAR(50),
	is_verified BOOLEAN NOT NULL DEFAULT false
);

DROP TABLE tbl_users;

SELECT * FROM tbl_users;

CREATE TABLE tbl_otp (
id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
otp VARCHAR(6) NOT NULL,
expires_at TIMESTAMP NOT NULL,
requested_at TIMESTAMP NOT NULL DEFAULT NOW()
);

DROP TABLE tbl_users;

INSERT INTO tbl_users (
    first_name, last_name, username, user_age, password, email, phone, role, is_verified
) VALUES
('Emasdasdasdan', 'Domo', 'EMAANasdasdNN', 11, 'hashed_password_here', 'emandomoasdasdertoasds@gmail.com', '09304573988', 'admin', true);

SELECT column_name, data_type, ordinal_position 
FROM information_schema.columns 
WHERE table_name = 'tbl_users' 
ORDER BY ordinal_position;
