const express = require('express');
const { createCourse, getCourses, getCourseById, updateCourse, deleteCourse } = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', protect, createCourse);
router.put('/:id', protect, updateCourse);
router.delete('/:id', protect, deleteCourse);

module.exports = router;