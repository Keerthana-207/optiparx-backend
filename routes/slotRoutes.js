const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ReservedSlot = require('../models/reservedSlot');
const User = require('../models/user');
const AdminMessage = require('../models/adminMessage');
const SlotConfig = require('../models/slotConfig');
const DeviceMessage = require('../models/deviceMessage');

// Duration mapping
const DURATION_MAP = {
  '30 min': 30,
  '1 hr': 60,
  '2 hrs': 120,
  '3 hrs': 180,
  '4 hrs': 240,
  'Full Day': 1440
};

// ✅ Get Total Slots
router.get('/total-slots', async (req, res) => {
  try {
    const config = await SlotConfig.findOne();
    res.json({ totalSlots: config?.totalSlots || 4 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch total slots' });
  }
});

// ✅ Update Total Slots (admin feature)
router.post('/set-total-slots', async (req, res) => {
  const { totalSlots } = req.body;
  if (!totalSlots || totalSlots < 1) {
    return res.status(400).json({ error: 'Invalid slot count' });
  }

  try {
    const existing = await SlotConfig.findOne();
    if (existing) {
      existing.totalSlots = totalSlots;
      await existing.save();
    } else {
      await SlotConfig.create({ totalSlots });
    }

    res.json({ message: 'Total slots updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update slots' });
  }
});

// ✅ Reserve Slot
router.post('/reserve-slot', async (req, res) => {
  const { slot, username, carPlate, duration } = req.body;

  if (!slot || !username || !carPlate || !duration) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const now = new Date();
    const minutes = DURATION_MAP[duration] || 60;
    const expiresAt = new Date(now.getTime() + minutes * 60000);

    const existing = await ReservedSlot.findOne({
      slot,
      expiresAt: { $gt: now }
    });

    if (existing) {
      return res.status(409).json({ error: 'Slot already reserved' });
    }

    const reservedSlot = new ReservedSlot({
      slot,
      username,
      carPlate,
      duration,
      reservedAt: now,
      expiresAt
    });

    await reservedSlot.save();

    await User.findOneAndUpdate(
      { username },
      {
        $push: {
          bookings: {
            carPlate,
            slot,
            duration,
            bookedAt: now
          }
        }
      }
    );

    res.json({ message: 'Slot reserved successfully!' });

  } catch (error) {
    console.error("Reservation error:", error);
    res.status(500).json({ error: 'Failed to reserve slot' });
  }
});

// ✅ Get Reserved Slots
router.get('/reserved-slots', async (req, res) => {
  try {
    const now = new Date();
    const reserved = await ReservedSlot.find({ expiresAt: { $gt: now } });
    const reservedSlots = reserved.map(r => r.slot);
    res.json({ reservedSlots });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reserved slots' });
  }
});

// ✅ Cancel Booking by Booking ID
router.delete('/cancel-booking/:bookingId', async (req, res) => {
  const { bookingId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ error: "Invalid booking ID" });
  }

  try {
    // Step 1: Find the user and the specific booking
    const user = await User.findOne({ "bookings._id": bookingId });

    if (!user) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const booking = user.bookings.id(bookingId);
    const { slot, carPlate } = booking;

    // Step 2: Remove booking from user
    await User.updateOne(
      { _id: user._id },
      { $pull: { bookings: { _id: bookingId } } }
    );

    // Step 3: Remove reservation from ReservedSlot
    await ReservedSlot.deleteOne({ slot, carPlate });

    res.json({ message: "Booking cancelled successfully" });

  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ error: "Error cancelling booking" });
  }
});


// ✅ Admin: Get All Users' Bookings (with status)
router.get('/all-bookings', async (req, res) => {
  try {
    const users = await User.find({}, 'username bookings');
    const bookings = [];

    const now = new Date();

    users.forEach(user => {
      user.bookings.forEach(booking => {
        const minutes = DURATION_MAP[booking.duration] || 60;
        const expiryTime = new Date(booking.bookedAt.getTime() + minutes * 60000);
        const status = expiryTime > now ? "Active" : "Expired";

        bookings.push({
          bookingId: booking._id,
          username: user.username,
          slot: booking.slot,
          duration: booking.duration,
          bookedAt: booking.bookedAt,
          status
        });
      });
    });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// ✅ Get Bookings for a Specific User
router.get('/bookings/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ bookings: user.bookings });
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/device-message', async (req, res) => {
  const { msg, slot } = req.body;

  if (!msg || !slot) {
    return res.status(400).json({ error: "Missing 'msg' or 'slot' in request body" });
  }

  try {
    const newMessage = new DeviceMessage({
      slot,
      message: msg
    });

    await newMessage.save();
    res.json({ message: "Device message saved successfully" });
  } catch (err) {
    console.error("Error saving device message:", err);
    res.status(500).json({ error: "Server error saving device message" });
  }
});

router.get('/device-messages', async (req, res) => {
  try {
    const messages = await DeviceMessage.find().sort({ createdAt: -1 }).limit(20);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch device messages" });
  }
});


module.exports = router;

