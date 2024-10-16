require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const sequelize = require('./config/database');
const { DataTypes } = require('sequelize');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'https://codebin-seven.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ... rest of your server code
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500
});
app.use(limiter);

// Define Snippet model
const Snippet = sequelize.define('Snippet', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

app.post('/api/snippets', [
  body('title').trim().isLength({ min: 1, max: 100 }).escape(),
  body('code').trim().isLength({ min: 1, max: 10000 }),
  body('language').trim().isIn(['text', 'javascript', 'python', 'java', 'csharp', 'php']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const snippet = await Snippet.create(req.body);
    res.status(201).json({ id: snippet.id });
  } catch (error) {
    console.error('Error creating snippet:', error);
    res.status(500).json({ error: 'Error creating snippet', details: error.message });
  }
});

app.get('/api/snippets/:id', async (req, res) => {
  try {
    const snippet = await Snippet.findByPk(req.params.id);
    if (!snippet) {
      return res.status(404).json({ error: 'Snippet not found' });
    }
    res.json(snippet);
  } catch (error) {
    console.error('Error fetching snippet:', error);
    res.status(500).json({ error: 'Error fetching snippet', details: error.message });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const startServer = async () => {
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      await sequelize.sync();
      console.log('All models were synchronized successfully.');

      if (process.env.VERCEL) {
        console.log('Running on Vercel, exporting app');
        module.exports = app;
      } else {
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
          console.log(`Server running at http://localhost:${port}`);
        });
      }
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      console.error('Error stack:', error.stack);
    }
  };

startServer();

module.exports=app;