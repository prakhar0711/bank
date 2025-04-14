const transactionsRouter = require('./routes/transactions');

// Routes
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/loans', loansRouter);
app.use('/api/transactions', transactionsRouter); 