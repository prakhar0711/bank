DELIMITER //

-- Create a table to store registration messages
CREATE TABLE IF NOT EXISTS registration_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    message_type ENUM('success', 'error') NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) //

-- Trigger to handle successful customer registration
CREATE TRIGGER after_customer_insert
AFTER INSERT ON customers
FOR EACH ROW
BEGIN
    INSERT INTO registration_messages (user_id, message_type, message)
    VALUES (NEW.user_id, 'success', 
        CONCAT('Customer registration successful! Welcome ', NEW.first_name, ' ', NEW.last_name, 
        '. A default savings account has been created for you.')
    );
END //

-- Trigger to handle successful employee registration
CREATE TRIGGER after_employee_insert
AFTER INSERT ON employees
FOR EACH ROW
BEGIN
    INSERT INTO registration_messages (user_id, message_type, message)
    VALUES (NEW.user_id, 'success', 
        CONCAT('Employee registration successful! Welcome ', NEW.first_name, ' ', NEW.last_name, 
        ' to the team as a ', NEW.position, ' in the ', NEW.department, ' department.')
    );
END //

-- Trigger to handle registration errors
CREATE TRIGGER before_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    DECLARE error_message TEXT;
    
    -- Check username format
    IF NEW.username NOT REGEXP '^[a-zA-Z0-9_]{3,50}$' THEN
        SET error_message = 'Username must be 3-50 characters long and contain only letters, numbers, and underscores';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
    
    -- Check email format
    IF NEW.email NOT REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
        SET error_message = 'Invalid email format';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
    
    -- Check password strength
    IF NEW.password NOT REGEXP '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,}$' THEN
        SET error_message = 'Password must be at least 6 characters long and contain both letters and numbers';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
END //

-- Trigger to handle validation errors for customers
CREATE TRIGGER before_customer_insert
BEFORE INSERT ON customers
FOR EACH ROW
BEGIN
    DECLARE error_message TEXT;
    
    -- Check phone number format
    IF NEW.phone NOT REGEXP '^[0-9]{10}$' THEN
        SET error_message = 'Phone number must be 10 digits';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
    
    -- Check date of birth
    IF NEW.date_of_birth >= CURDATE() THEN
        SET error_message = 'Date of birth must be in the past';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
END //

-- Trigger to handle validation errors for employees
CREATE TRIGGER before_employee_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    DECLARE error_message TEXT;
    
    -- Check phone number format
    IF NEW.phone NOT REGEXP '^[0-9]{10}$' THEN
        SET error_message = 'Phone number must be 10 digits';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
    
    -- Check date of birth
    IF NEW.date_of_birth >= CURDATE() THEN
        SET error_message = 'Date of birth must be in the past';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
    
    -- Check hire date
    IF NEW.hire_date > CURDATE() THEN
        SET error_message = 'Hire date cannot be in the future';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = error_message;
    END IF;
END //

DELIMITER ; 