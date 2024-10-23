const mongoose = require('mongoose');

const SnippetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  language: {
    type: String,
    required: true,
    enum: ['text', 'javascript', 'python', 'java', 'csharp', 'php']
  }
}, { timestamps: true });

module.exports = mongoose.model('Snippet', SnippetSchema);
