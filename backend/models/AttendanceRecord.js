const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  blockName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Leave'],
    default: 'Absent',
  }
}, { timestamps: true });

AttendanceRecordSchema.index({ student: 1, date: 1 }, { unique: true });

const AttendanceRecord = mongoose.model('AttendanceRecord', AttendanceRecordSchema);

module.exports = AttendanceRecord;