const express = require('express');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalCustomers,
      totalVehicles,
      totalBookings,
      availableVehicles,
      activeBookings,
      revenueData,
      recentBookings,
      bookingsByStatus,
      vehiclesByStatus,
    ] = await Promise.all([
      Customer.countDocuments(),
      Vehicle.countDocuments(),
      Booking.countDocuments(),
      Vehicle.countDocuments({ status: 'available' }),
      Booking.countDocuments({ status: { $in: ['confirmed', 'active'] } }),
      Booking.aggregate([
        { $match: { status: { $in: ['completed', 'confirmed', 'active'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
      Booking.find()
        .populate('customer', 'name email')
        .populate('vehicle', 'make model licensePlate')
        .sort({ createdAt: -1 })
        .limit(5),
      Booking.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Vehicle.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = revenueData[0]?.totalRevenue || 0;

    // Monthly revenue for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'confirmed', 'active'] },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalVehicles,
        totalBookings,
        availableVehicles,
        activeBookings,
        totalRevenue,
        recentBookings,
        bookingsByStatus,
        vehiclesByStatus,
        monthlyRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
