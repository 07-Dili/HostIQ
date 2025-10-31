const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
  blockName: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 1,
    maxlength: 1,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Mixed'],
    required: true,
  },
  warden: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  wardenEmail: {
    type: String,
    required: true,
    unique: true,
  }
}, { timestamps: true });

const Block = mongoose.model('Block', BlockSchema);

module.exports = Block;