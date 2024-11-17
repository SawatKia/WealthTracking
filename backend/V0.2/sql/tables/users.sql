-- TABLE: users
CREATE TABLE
    IF NOT EXISTS users (
        national_id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        username VARCHAR(50) NOT NULL,
        hashed_password VARCHAR(255),
        role VARCHAR(20) NOT NULL,
        member_since TIMESTAMP NOT NULL,
        date_of_birth DATE,
        auth_service VARCHAR(20) DEFAULT 'local',
        profile_picture_uri VARCHAR(255),
        CONSTRAINT check_auth_service CHECK (
            auth_service IN ('local', 'google', 'facebook', 'apple')
        ),
        CONSTRAINT check_password_requirement CHECK (
            (
                auth_service = 'local'
                AND hashed_password IS NOT NULL
            )
            OR (auth_service != 'local')
        )
    );