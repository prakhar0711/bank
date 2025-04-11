const mysql = require('mysql2/promise');
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
class UserService {
    static async registerUser(userData) {
        try {
            const {
                username,
                email,
                password,
                role,
                firstName,
                lastName,
                dateOfBirth,
                street,
                city,
                state,
                postalCode,
                country,
                phone,
                position,
                department,
                hireDate
            } = userData;

            // Prepare parameters for the procedure call
            const params = [
                username,
                email,
                password,
                role,
                firstName,
                lastName,
                dateOfBirth,
                street,
                city,
                state,
                postalCode,
                country,
                phone
            ];

            // Add employee-specific parameters only if they exist and are not empty strings
            if (role === 'employee') {
                params.push(
                    position || null,
                    department || null,
                    hireDate || null
                );
            } else {
                // For non-employee roles, pass NULL for employee-specific fields
                params.push(null, null, null);
            }

            // Add output parameter placeholders
            params.push('@user_id', '@customer_id', '@employee_id', '@success', '@message');

            // Call the PL/SQL procedure
            const [result] = await db.query(
                `CALL register_user(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @user_id, @customer_id, @employee_id, @success, @message)`,
                params
            );

            // Get the output parameters
            const [output] = await db.query(
                'SELECT @user_id as userId, @customer_id as customerId, @employee_id as employeeId, @success as success, @message as message'
            );

            const { userId, customerId, employeeId, success, message } = output[0];

            if (!success) {
                return {
                    success: false,
                    error: message
                };
            }

            // Get the registration message
            const [messages] = await db.query(
                'SELECT message_type, message FROM registration_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
                [userId]
            );

            return {
                success: true,
                userId,
                customerId,
                employeeId,
                message: messages[0]?.message || 'Registration successful',
                messageType: messages[0]?.message_type || 'success'
            };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.message || 'Registration failed due to database error'
            };
        }
    }
}

module.exports = UserService; 