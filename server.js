require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const connectDB = require('./config/database');
const Snippet = require('./models/Snippet');

// Add this near the top of the file, after the require statements
console.log('Environment variables:', {
  MONGODB_URI: process.env.MONGODB_URI ? '[REDACTED]' : 'undefined',
  NODE_ENV: process.env.NODE_ENV,
  // Add any other non-sensitive variables you want to check
});

const app = express();

// Connect to MongoDB
connectDB();

// Update CORS configuration
app.use(cors({
  origin: ['https://codebin-seven.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicitly handle OPTIONS requests
app.options('*', cors());

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500
});
app.use(limiter);

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
    const snippet = new Snippet(req.body);
    await snippet.save();
    res.status(201).json({ id: snippet._id });
  } catch (error) {
    console.error('Error creating snippet:', error);
    res.status(500).json({ error: 'Error creating snippet', details: error.message });
  }
});

app.get('/api/snippets/:id', async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
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

app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS is working' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
