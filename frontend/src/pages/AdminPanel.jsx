import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const AdminPanel = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [message, setMessage] = useState('');
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', instructor: '', schedule: '', capacity: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axiosInstance.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      setMessage('Failed to load courses');
    }
  };

  const fetchEnrollments = async () => {   // ✅ plain async function
    try {
      const response = await axiosInstance.get('/api/enrollments/all', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setEnrollments(response.data);
    } catch (error) {
      setMessage('Failed to load enrollments');
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchEnrollments();
  }, []); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axiosInstance.put(`/api/courses/${editingCourse._id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMessage('Course updated successfully!');
      } else {
        await axiosInstance.post('/api/courses', formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMessage('Course created successfully!');
      }
      setFormData({ title: '', description: '', instructor: '', schedule: '', capacity: '' });
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      setMessage('Failed to save course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      instructor: course.instructor,
      schedule: course.schedule,
      capacity: course.capacity
    });
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await axiosInstance.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage('Course deleted successfully!');
      fetchCourses();
    } catch (error) {
      setMessage('Failed to delete course');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      {message && (
        <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4">{message}</div>
      )}

      {/* Course Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {editingCourse ? 'Edit Course' : 'Create New Course'}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Course Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Instructor Name"
            value={formData.instructor}
            onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Schedule (e.g. Monday 9am-11am)"
            value={formData.schedule}
            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
            required
          />
          <div className="flex gap-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              {editingCourse ? 'Update Course' : 'Create Course'}
            </button>
            {editingCourse && (
              <button
                type="button"
                onClick={() => { setEditingCourse(null); setFormData({ title: '', description: '', instructor: '', schedule: '', capacity: '' }); }}
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Course List */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">All Courses</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Title</th>
              <th className="p-3">Instructor</th>
              <th className="p-3">Schedule</th>
              <th className="p-3">Enrolled</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id} className="border-t">
                <td className="p-3">{course.title}</td>
                <td className="p-3">{course.instructor}</td>
                <td className="p-3">{course.schedule}</td>
                <td className="p-3">{course.enrolled}/{course.capacity}</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enrollments */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">All Enrollments</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">Student</th>
              <th className="p-3">Email</th>
              <th className="p-3">Course</th>
              <th className="p-3">Instructor</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment._id} className="border-t">
                <td className="p-3">{enrollment.student?.name}</td>
                <td className="p-3">{enrollment.student?.email}</td>
                <td className="p-3">{enrollment.course?.title}</td>
                <td className="p-3">{enrollment.course?.instructor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;