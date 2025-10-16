const mongoose = require('mongoose');

const reservedSlotSchema = new mongoose.Schema({
  slot: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  carPlate: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    enum: ['30 min', '1 hr', '2 hrs', '3 hrs', '4 hrs', 'Full Day'],
    required: true
  },
  reservedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index: remove document when expiresAt is reached
  }
});

const ReservedSlot = mongoose.model('ReservedSlot', reservedSlotSchema);

module.exports = ReservedSlot;
