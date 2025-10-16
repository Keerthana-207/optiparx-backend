const mongoose = require('mongoose');

const deviceMessageSchema = new mongoose.Schema({
  slot: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeviceMessage', deviceMessageSchema);
