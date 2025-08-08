const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS properly
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);

app.get('/', (req, res) => {
    res.send('API Running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
