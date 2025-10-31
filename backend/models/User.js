const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  year: {
    type: Number,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'warden', 'admin'],
    default: 'student',
    required: true,
  },
  hobbies: {
    type: [String],
    required: false,
    default: [],
  },
  blockName: { 
    type: String,
    required: false,
  },
  roomNumber: { 
    type: Number,
    required: false,
  },
  fees: { 
    type: Number,
    required: false,
    default: 0
  },
  attendance: { 
    type: String,
    enum: ['Present', 'Absent', 'Leave'],
    required: true,
    default: 'Absent'
  }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;