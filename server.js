const express = require('express');
const cors = require('cors');
require('dotenv').config();

const patientRoutes = require('./routes/patientRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Request logging for observability
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/', patientRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ data: null, error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server actively running on http://localhost:${PORT}`);
});