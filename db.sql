-- Banking System Database Creation
CREATE DATABASE IF NOT EXISTS Bank;
USE Bank;

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS AuditLog;
DROP TABLE IF EXISTS Employee;
DROP TABLE IF EXISTS Role;
DROP TABLE IF EXISTS Branch;
DROP TABLE IF EXISTS Loan;
DROP TABLE IF EXISTS Cards;
DROP TABLE IF EXISTS Transaction;
DROP TABLE IF EXISTS Account;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Address;

-- Create Address table
CREATE TABLE Address (
    AddressID INT PRIMARY KEY AUTO_INCREMENT,
    Street VARCHAR(100) NOT NULL,
    City VARCHAR(50) NOT NULL,
    State VARCHAR(50),
    ZipCode VARCHAR(20) NOT NULL,
    Country VARCHAR(50) NOT NULL
);

-- Create Customer table
CREATE TABLE Customer (
    CustomerID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    DateOfBirth DATE,
    PhoneNumber VARCHAR(20),
    Email VARCHAR(100) UNIQUE,
    Password VARCHAR(100) NOT NULL,
    AddressID INT,
    FOREIGN KEY (AddressID) REFERENCES Address(AddressID)
);

-- Create Branch table (needs to be before Employee due to ManagerID reference)
CREATE TABLE Branch (
    BranchID INT PRIMARY KEY AUTO_INCREMENT,
    BranchName VARCHAR(100) NOT NULL,
    Location VARCHAR(100) NOT NULL,
    ContactNumber VARCHAR(20),
    ManagerID INT NULL
    -- FOREIGN KEY for ManagerID will be added after Employee table is created
);

-- Create Role table
CREATE TABLE Role (
    RoleID INT PRIMARY KEY AUTO_INCREMENT,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

-- Create Employee table
CREATE TABLE Employee (
    EmployeeID INT PRIMARY KEY AUTO_INCREMENT,
    RoleID INT NOT NULL,
    BranchID INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(20),
    Email VARCHAR(100) UNIQUE,
    Password VARCHAR(100) NOT NULL,
    FOREIGN KEY (RoleID) REFERENCES Role(RoleID),
    FOREIGN KEY (BranchID) REFERENCES Branch(BranchID)
);

-- Now add the foreign key constraint for Branch.ManagerID
ALTER TABLE Branch
ADD CONSTRAINT FK_Branch_Employee
FOREIGN KEY (ManagerID) REFERENCES Employee(EmployeeID);

-- Create Account table
CREATE TABLE Account (
    AccountNumber VARCHAR(20) PRIMARY KEY,
    CustomerID INT NOT NULL,
    BranchID INT NOT NULL,
    AccountType VARCHAR(50) NOT NULL,
    Balance DECIMAL(15,2) DEFAULT 0.00,
    DateCreated DATE NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),
    FOREIGN KEY (BranchID) REFERENCES Branch(BranchID)
);

-- Create Transaction table
CREATE TABLE Transaction (
    TransactionID INT PRIMARY KEY AUTO_INCREMENT,
    AccountNumber VARCHAR(20) NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    TransactionType VARCHAR(50) NOT NULL,
    DateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AccountNumber) REFERENCES Account(AccountNumber)
);

-- Create Cards table
CREATE TABLE Cards (
    CardNumber VARCHAR(20) PRIMARY KEY,
    AccountNumber VARCHAR(20) NOT NULL,
    CardType VARCHAR(50) NOT NULL,
    ExpiryDate DATE NOT NULL,
    CVV VARCHAR(5) NOT NULL,
    FOREIGN KEY (AccountNumber) REFERENCES Account(AccountNumber)
);

-- Create Loan table
CREATE TABLE Loan (
    LoanID INT PRIMARY KEY AUTO_INCREMENT,
    CustomerID INT NOT NULL,
    LoanType VARCHAR(50) NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    InterestRate DECIMAL(5,2) NOT NULL,
    DurationMonths INT NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)
);

-- Create AuditLog table
CREATE TABLE AuditLog (
    LogID INT PRIMARY KEY AUTO_INCREMENT,
    EmployeeID INT NOT NULL,
    ActionPerformed VARCHAR(200) NOT NULL,
    DateTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
);

-- Insert sample data for Roles
INSERT INTO Role (RoleName) VALUES
('Employee'),
('Customer');

-- Insert sample address data
INSERT INTO Address (Street, City, State, ZipCode, Country) VALUES
('123 Main St', 'New York', 'NY', '10001', 'USA'),
('456 Park Ave', 'Los Angeles', 'CA', '90001', 'USA'),
('789 Oak Dr', 'Chicago', 'IL', '60601', 'USA'),
('101 Pine St', 'San Francisco', 'CA', '94101', 'USA'),
('202 Maple Rd', 'Boston', 'MA', '02108', 'USA');

-- Insert sample branch data (without manager initially)
INSERT INTO Branch (BranchName, Location, ContactNumber) VALUES
('Main Branch', 'New York Downtown', '212-555-1000'),
('West Coast HQ', 'Los Angeles Central', '213-555-2000'),
('Midwest Office', 'Chicago Loop', '312-555-3000'),
('Bay Area Branch', 'San Francisco Financial District', '415-555-4000');

-- Insert sample employees
-- Note: We need to insert employees without manager reference first
INSERT INTO Employee (RoleID, BranchID, Name, PhoneNumber, Email, Password) VALUES
(1, 1, 'John Smith', '212-555-1001', 'john.smith@bank.com', 'hashedpassword1'),
(1, 2, 'Sarah Johnson', '213-555-2001', 'sarah.johnson@bank.com', 'hashedpassword2'),
(1, 3, 'Michael Brown', '312-555-3001', 'michael.brown@bank.com', 'hashedpassword3'),
(1, 4, 'Emily Davis', '415-555-4001', 'emily.davis@bank.com', 'hashedpassword4');

-- Update branches with manager IDs
UPDATE Branch SET ManagerID = 1 WHERE BranchID = 1;
UPDATE Branch SET ManagerID = 2 WHERE BranchID = 2;
UPDATE Branch SET ManagerID = 3 WHERE BranchID = 3;
UPDATE Branch SET ManagerID = 4 WHERE BranchID = 4;

-- Insert sample customers
INSERT INTO Customer (Name, DateOfBirth, PhoneNumber, Email, Password, AddressID) VALUES
('Robert Williams', '1985-07-15', '555-123-4567', 'robert@example.com', 'hashedpassword5', 1),
('Jennifer Lee', '1990-03-22', '555-234-5678', 'jennifer@example.com', 'hashedpassword6', 2),
('David Miller', '1978-11-30', '555-345-6789', 'david@example.com', 'hashedpassword7', 3),
('Lisa Garcia', '1982-05-18', '555-456-7890', 'lisa@example.com', 'hashedpassword8', 4),
('James Wilson', '1995-09-25', '555-567-8901', 'james@example.com', 'hashedpassword9', 5);

-- Insert sample accounts
INSERT INTO Account (AccountNumber, CustomerID, BranchID, AccountType, Balance, DateCreated) VALUES
('ACCT10001', 1, 1, 'Savings', 5000.00, '2022-01-15'),
('ACCT10002', 1, 1, 'Checking', 2500.00, '2022-01-15'),
('ACCT20001', 2, 2, 'Savings', 7500.00, '2022-02-20'),
('ACCT30001', 3, 3, 'Checking', 3000.00, '2022-03-10'),
('ACCT40001', 4, 4, 'Savings', 10000.00, '2022-04-05'),
('ACCT50001', 5, 1, 'Investment', 25000.00, '2022-05-12');

-- Insert sample transactions
INSERT INTO Transaction (AccountNumber, Amount, TransactionType, DateTime) VALUES
('ACCT10001', 1000.00, 'Deposit', '2022-02-01 10:30:00'),
('ACCT10002', -500.00, 'Withdrawal', '2022-02-05 14:45:00'),
('ACCT20001', 2000.00, 'Deposit', '2022-03-01 09:15:00'),
('ACCT30001', -1000.00, 'Withdrawal', '2022-03-15 16:30:00'),
('ACCT40001', 5000.00, 'Deposit', '2022-04-10 11:00:00'),
('ACCT10001', -200.00, 'Transfer', '2022-04-15 13:20:00');

-- Insert sample cards
INSERT INTO Cards (CardNumber, AccountNumber, CardType, ExpiryDate, CVV) VALUES
('4111111111111111', 'ACCT10002', 'Debit', '2025-12-31', '123'),
('5555555555554444', 'ACCT20001', 'Credit', '2026-06-30', '456'),
('4222222222222222', 'ACCT30001', 'Debit', '2025-09-30', '789'),
('5333333333333333', 'ACCT40001', 'Credit', '2026-03-31', '321');

-- Insert sample loans
INSERT INTO Loan (CustomerID, LoanType, Amount, InterestRate, DurationMonths) VALUES
(1, 'Personal', 10000.00, 5.25, 36),
(2, 'Auto', 25000.00, 4.75, 60),
(3, 'Home', 300000.00, 3.25, 360),
(5, 'Education', 50000.00, 4.50, 120);

-- Insert sample audit logs
INSERT INTO AuditLog (EmployeeID, ActionPerformed, DateTime) VALUES
(1, 'Created new customer account', '2022-01-15 09:30:00'),
(2, 'Processed loan application', '2022-02-20 14:15:00'),
(3, 'Updated customer information', '2022-03-10 11:45:00'),
(4, 'Approved credit limit increase', '2022-04-05 13:30:00');