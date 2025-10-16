const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  carPlate: String,
  slot: String,
  duration: {
    type: String,
    enum: ['30 min', '1 hr', '2 hrs', '3 hrs', '4 hrs', 'Full Day'],
  },
  bookedAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  bookings: [bookingSchema],
  createdAt: { type: Date, default: Date.now }
});

// custom validation etc.
userSchema.pre('validate', function(next) {
  if (!this.phone && !this.email) {
    next(new Error('Either phone or email is required.'));
  } else {
    next();
  }
});

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;
