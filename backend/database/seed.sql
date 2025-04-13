-- Insert dummy addresses
INSERT INTO addresses (street, city, state, postal_code, country, created_at) VALUES
('123 Main St', 'New York', 'NY', '10001', 'USA', '2024-01-01 08:00:00'),
('456 Oak Ave', 'Los Angeles', 'CA', '90001', 'USA', '2024-01-01 09:00:00'),
('789 Pine Rd', 'Chicago', 'IL', '60601', 'USA', '2024-01-02 09:00:00'),
('321 Bank St', 'Boston', 'MA', '02108', 'USA', '2024-01-01 10:00:00'),
('654 Finance Ave', 'San Francisco', 'CA', '94105', 'USA', '2024-01-02 11:00:00');

-- Insert dummy users (admin, employees, and customers)
INSERT INTO users (username, email, password, role, created_at) VALUES
('admin', 'admin@bank.com', 'admin123', 'admin', '2024-01-01 08:00:00'),
('employee1', 'sarah@bank.com', 'employee123', 'employee', '2024-01-01 09:00:00'),
('employee2', 'mike@bank.com', 'employee123', 'employee', '2024-01-02 09:00:00'),
('john_doe', 'john@example.com', 'password123', 'customer', '2024-01-01 10:00:00'),
('jane_smith', 'jane@example.com', 'password123', 'customer', '2024-01-02 11:00:00'),
('bob_wilson', 'bob@example.com', 'password123', 'customer', '2024-01-03 12:00:00');

-- Insert dummy employees
INSERT INTO employees (user_id, first_name, last_name, date_of_birth, address_id, phone, email, position, department, hire_date, created_at) VALUES
(2, 'Sarah', 'Johnson', '1985-05-15', 4, '1112223333', 'sarah@bank.com', 'Loan Officer', 'Loans', '2023-01-15', '2024-01-01 09:00:00'),
(3, 'Mike', 'Brown', '1990-08-22', 5, '4445556666', 'mike@bank.com', 'Account Manager', 'Customer Service', '2023-03-10', '2024-01-02 09:00:00');

-- Insert dummy customers
INSERT INTO customers (user_id, first_name, last_name, date_of_birth, address_id, phone, email, created_at) VALUES
(4, 'John', 'Doe', '1992-03-10', 1, '1234567890', 'john@example.com', '2024-01-01 10:00:00'),
(5, 'Jane', 'Smith', '1988-07-25', 2, '0987654321', 'jane@example.com', '2024-01-02 11:00:00'),
(6, 'Bob', 'Wilson', '1995-11-30', 3, '5555555555', 'bob@example.com', '2024-01-03 12:00:00');

-- Insert dummy accounts
INSERT INTO accounts (customer_id, account_number, account_type, balance, status, created_at) VALUES
(1, 'ACC001', 'savings', 5000.00, 'active', '2024-01-01 10:30:00'),
(1, 'ACC002', 'current', 2500.00, 'active', '2024-01-01 10:35:00'),
(2, 'ACC003', 'savings', 10000.00, 'active', '2024-01-02 11:30:00'),
(3, 'ACC004', 'current', 1500.00, 'active', '2024-01-03 12:30:00');

-- Insert dummy transactions
INSERT INTO transactions (account_id, transaction_type, amount, description, status, created_at) VALUES
(1, 'deposit', 5000.00, 'Initial deposit', 'completed', '2024-01-01 10:30:00'),
(1, 'withdrawal', 1000.00, 'ATM withdrawal', 'completed', '2024-01-02 11:00:00'),
(2, 'deposit', 2500.00, 'Salary deposit', 'completed', '2024-01-03 12:00:00'),
(3, 'deposit', 10000.00, 'Initial deposit', 'completed', '2024-01-02 11:30:00'),
(4, 'deposit', 1500.00, 'Initial deposit', 'completed', '2024-01-03 12:30:00'),
(1, 'transfer', 500.00, 'Transfer to savings', 'completed', '2024-01-04 14:00:00'),
(2, 'withdrawal', 200.00, 'Grocery shopping', 'completed', '2024-01-05 15:00:00');


-- Insert dummy loan products
INSERT INTO loan_products (name, description, loan_type, min_amount, max_amount, min_duration, max_duration, interest_rate, created_by, is_active, created_at) VALUES
('Personal Loan', 'Basic personal loan for various purposes', 'personal', 1000.00, 50000.00, 12, 36, 8.5, 1, TRUE, '2024-01-01 08:00:00'),
('Home Loan', 'Mortgage loan for home purchase', 'home', 50000.00, 500000.00, 60, 360, 6.5, 1, TRUE, '2024-01-01 08:00:00'),
('Car Loan', 'Auto loan for vehicle purchase', 'car', 5000.00, 100000.00, 12, 60, 7.5, 1, TRUE, '2024-01-01 08:00:00'),
('Business Loan', 'Loan for business expansion', 'business', 10000.00, 200000.00, 12, 48, 9.5, 1, TRUE, '2024-01-01 08:00:00');

-- Insert dummy loans
INSERT INTO loans (customer_id, loan_type, amount, interest_rate, duration, monthly_payment, status, loan_product_id, created_at) VALUES
(1, 'personal', 10000.00, 8.5, 36, 315.50, 'approved', 1, '2024-01-05 14:00:00'),
(2, 'home', 200000.00, 6.5, 360, 1265.00, 'pending', 2, '2024-01-06 15:00:00'),
(3, 'car', 25000.00, 7.5, 60, 500.75, 'approved', 3, '2024-01-07 16:00:00'),
(1, 'business', 50000.00, 9.5, 48, 1250.00, 'rejected', 4, '2024-01-08 17:00:00');

-- Insert dummy loan payments
INSERT INTO loan_payments (loan_id, payment_date, amount, principal, interest, status, created_at) VALUES
(1, '2024-02-05', 315.50, 250.00, 65.50, 'completed', '2024-02-05 10:00:00'),
(1, '2024-03-05', 315.50, 252.50, 63.00, 'completed', '2024-03-05 10:00:00'),
(3, '2024-02-07', 500.75, 400.00, 100.75, 'completed', '2024-02-07 10:00:00'),
(3, '2024-03-07', 500.75, 403.00, 97.75, 'pending', '2024-03-07 10:00:00'); 