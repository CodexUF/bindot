const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    totalDays: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate totalDays and totalAmount before saving
bookingSchema.pre('save', async function (next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(new Date(this.endDate) - new Date(this.startDate));
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }

  if (this.vehicle && this.totalDays) {
    const Vehicle = mongoose.model('Vehicle');
    const vehicle = await Vehicle.findById(this.vehicle);
    if (vehicle) {
      this.totalAmount = vehicle.dailyRate * this.totalDays;
    }
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
