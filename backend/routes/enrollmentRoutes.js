const express = require('express');
const { enrollCourse, getMyEnrollments, dropCourse, getAllEnrollments } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/:courseId', protect, enrollCourse);
router.get('/my', protect, getMyEnrollments);
router.delete('/:courseId', protect, dropCourse);
router.get('/all', protect, getAllEnrollments);

module.exports = router;