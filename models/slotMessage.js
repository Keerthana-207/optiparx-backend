const mongoose = require('mongoose');

const slotMessageSchema = new mongoose.Schema({
  slot: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SlotMessage', slotMessageSchema);
