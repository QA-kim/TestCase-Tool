-- Create admin user in Supabase
-- Password: admin123! (hashed with pbkdf2_sha256)

-- Generate a unique ID for the admin user
DO $$
DECLARE
    admin_id TEXT;
BEGIN
    -- Generate UUID-like ID
    admin_id := 'admin-' || substr(md5(random()::text), 1, 24);

    -- Delete existing admin user if exists
    DELETE FROM users WHERE username = 'admin' OR email = 'admin@tcms.com';

    -- Insert new admin user
    INSERT INTO users (
        id,
        email,
        username,
        password_hash,
        full_name,
        role,
        is_active,
        failed_login_attempts,
        locked_until,
        is_temp_password,
        password_reset_at,
        password_changed_at,
        created_at,
        updated_at
    ) VALUES (
        admin_id,
        'admin@tcms.com',
        'admin',
        '$pbkdf2-sha256$29000$zjmH8L6Xck6pFYIwxjjHOA$lGIwHvRFyX.xIxrMexvxnyEW5iLUvpF1tTHGk4tZl4Y',  -- admin123!
        'Administrator',
        'admin',
        TRUE,
        0,
        NULL,
        FALSE,
        NULL,
        NULL,
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Admin user created successfully with ID: %', admin_id;
    RAISE NOTICE 'Login credentials:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: admin123!';
END $$;
