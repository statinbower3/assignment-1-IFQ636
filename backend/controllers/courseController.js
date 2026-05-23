const Course = require('../models/Course');

// CREATE a course (admin only)
const createCourse = async (req, res) => {
    try {
        const { title, description, instructor, schedule, capacity } = req.body;
        const course = await Course.create({ title, description, instructor, schedule, capacity });
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ all courses
const getCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ single course
const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE a course (admin only)
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE a course (admin only)
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createCourse, getCourses, getCourseById, updateCourse, deleteCourse };