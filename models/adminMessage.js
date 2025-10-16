const mongoose = require('mongoose');

const adminMessageSchema = new mongoose.Schema({
  message: String,
  slot: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminMessage', adminMessageSchema);
