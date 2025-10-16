const mongoose = require('mongoose');

const slotConfigSchema = new mongoose.Schema({
  totalSlots: { type: Number, required: true, default: 20 }
});

module.exports = mongoose.model('SlotConfig', slotConfigSchema);
