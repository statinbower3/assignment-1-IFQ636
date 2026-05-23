const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// ENROLL in a course (student)
const enrollCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });

        if (course.enrolled >= course.capacity) {
            return res.status(400).json({ message: 'Course is full' });
        }

        const alreadyEnrolled = await Enrollment.findOne({
            student: req.user.id,
            course: req.params.courseId
        });
        if (alreadyEnrolled) return res.status(400).json({ message: 'Already enrolled in this course' });

        const enrollment = await Enrollment.create({
            student: req.user.id,
            course: req.params.courseId
        });

        course.enrolled += 1;
        await course.save();

        res.status(201).json(enrollment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET my enrollments (student)
const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find({ student: req.user.id })
            .populate('course');
        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DROP a course (student)
const dropCourse = async (req, res) => {
    try {
        const enrollment = await Enrollment.findOneAndDelete({
            student: req.user.id,
            course: req.params.courseId
        });
        if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

        const course = await Course.findById(req.params.courseId);
        if (course) {
            course.enrolled -= 1;
            await course.save();
        }

        res.status(200).json({ message: 'Course dropped successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET all enrollments (admin)
const getAllEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment.find()
            .populate('student', 'name email')
            .populate('course', 'title instructor');
        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { enrollCourse, getMyEnrollments, dropCourse, getAllEnrollments };