DELIMITER //

CREATE PROCEDURE register_user(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_role ENUM('admin', 'employee', 'customer'),
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_date_of_birth DATE,
    IN p_street VARCHAR(100),
    IN p_city VARCHAR(50),
    IN p_state VARCHAR(50),
    IN p_postal_code VARCHAR(20),
    IN p_country VARCHAR(50),
    IN p_phone VARCHAR(20),
    IN p_position VARCHAR(50),
    IN p_department VARCHAR(50),
    IN p_hire_date DATE,
    OUT p_user_id INT,
    OUT p_customer_id INT,
    OUT p_employee_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
proc_label: BEGIN
    DECLARE v_address_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Registration failed due to database error';
    END;

    START TRANSACTION;

    -- Check if username or email already exists
    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        SET p_success = FALSE;
        SET p_message = 'Username already exists';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        SET p_success = FALSE;
        SET p_message = 'Email already exists';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Insert address
    INSERT INTO addresses (street, city, state, postal_code, country)
    VALUES (p_street, p_city, p_state, p_postal_code, p_country);
    
    SET v_address_id = LAST_INSERT_ID();

    -- Insert user
    INSERT INTO users (username, email, password, role)
    VALUES (p_username, p_email, p_password, p_role);
    
    SET p_user_id = LAST_INSERT_ID();

    -- Create appropriate record based on role
    IF p_role = 'customer' THEN
        -- Create customer record
        INSERT INTO customers (user_id, first_name, last_name, date_of_birth, address_id, phone, email)
        VALUES (p_user_id, p_first_name, p_last_name, p_date_of_birth, v_address_id, p_phone, p_email);
        
        SET p_customer_id = LAST_INSERT_ID();
        SET p_employee_id = NULL;
    ELSEIF p_role = 'employee' THEN
        -- Validate employee-specific fields
        IF p_position IS NULL OR p_department IS NULL OR p_hire_date IS NULL THEN
            SET p_success = FALSE;
            SET p_message = 'Employee registration requires position, department, and hire date';
            ROLLBACK;
            LEAVE proc_label;
        END IF;

        -- Create employee record
        INSERT INTO employees (user_id, first_name, last_name, date_of_birth, address_id, phone, email, position, department, hire_date)
        VALUES (p_user_id, p_first_name, p_last_name, p_date_of_birth, v_address_id, p_phone, p_email, p_position, p_department, p_hire_date);
        
        SET p_employee_id = LAST_INSERT_ID();
        SET p_customer_id = NULL;
    END IF;

    COMMIT;
    SET p_success = TRUE;
    SET p_message = 'Registration successful';
END proc_label //

DELIMITER ; 