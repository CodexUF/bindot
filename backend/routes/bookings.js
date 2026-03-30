const express = require('express');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /api/bookings
router.get('/', async (req, res) => {
  try {
    const { status, customerId, vehicleId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (customerId) query.customer = customerId;
    if (vehicleId) query.vehicle = vehicleId;

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('customer', 'name email phone')
      .populate('vehicle', 'make model licensePlate dailyRate type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: bookings, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer')
      .populate('vehicle');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/bookings
router.post('/', async (req, res) => {
  try {
    const { vehicle: vehicleId, startDate, endDate } = req.body;

    // Check if vehicle is available
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (vehicle.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Vehicle is not available for booking' });
    }

    // Check for overlapping bookings
    const overlapping = await Booking.findOne({
      vehicle: vehicleId,
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
      ],
    });
    if (overlapping) {
      return res.status(400).json({ success: false, message: 'Vehicle is already booked for this period' });
    }

    const booking = await Booking.create(req.body);

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'booked' });

    const populated = await Booking.findById(booking._id)
      .populate('customer', 'name email phone')
      .populate('vehicle', 'make model licensePlate dailyRate type');

    res.status(201).json({ success: true, data: populated, message: 'Booking created successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/bookings/:id
router.put('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const previousStatus = booking.status;
    const updated = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('customer', 'name email phone')
      .populate('vehicle', 'make model licensePlate dailyRate type');

    // Update vehicle status based on booking status change
    if (req.body.status && req.body.status !== previousStatus) {
      if (['completed', 'cancelled'].includes(req.body.status)) {
        await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available' });
      } else if (req.body.status === 'active') {
        await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'booked' });
      }
    }

    res.json({ success: true, data: updated, message: 'Booking updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Free up vehicle if booking was active
    if (['pending', 'confirmed', 'active'].includes(booking.status)) {
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
