const express = require('express');
const { protect, warden } = require('../middleware/authMiddleware');
const { 
  getUserProfile, 
  updateUserProfile, 
  getStudentDatabase,
  addStudent, 
  updateStudent, 
  updateStudentRoom, 
  deleteStudent,
  updateBulkAttendance, 
  updateBulkFees,
  getHobbyMatches,
  getDailyStatus,
  getAttendanceSummary
} = require('../controllers/userController');
const router = express.Router();

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);

router.route('/database').get(protect, getStudentDatabase); 

router.route('/student')
    .post(protect, addStudent); 

router.route('/student/:id')
    .put(protect, updateStudent)
    .delete(protect, deleteStudent);

router.route('/student/:id/room')
    .put(protect, updateStudentRoom);

router.route('/attendance').put(protect, updateBulkAttendance);
router.route('/attendance/summary').get(protect, getAttendanceSummary);
router.route('/attendance/daily-status').get(protect, getDailyStatus);
router.route('/fees').put(protect, updateBulkFees);

router.route('/hobby-match').post(protect, getHobbyMatches);

module.exports = router;