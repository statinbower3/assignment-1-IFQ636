import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const CourseList = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axiosInstance.get('/api/courses');
        setCourses(response.data);
      } catch (error) {
        setMessage('Failed to load courses');
      }
    };
    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      await axiosInstance.post(`/api/enrollments/${courseId}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage('Successfully enrolled!');
      const response = await axiosInstance.get('/api/courses');
      setCourses(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Enrollment failed');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Available Courses</h1>
      {message && (
        <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4">{message}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course._id} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-2">{course.title}</h2>
            <p className="text-gray-600 mb-2">{course.description}</p>
            <p className="text-sm text-gray-500 mb-1">👨‍🏫 {course.instructor}</p>
            <p className="text-sm text-gray-500 mb-1">📅 {course.schedule}</p>
            <p className="text-sm text-gray-500 mb-4">
              👥 {course.enrolled}/{course.capacity} enrolled
            </p>
            {user && (
              <button
                onClick={() => handleEnroll(course._id)}
                disabled={course.enrolled >= course.capacity}
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {course.enrolled >= course.capacity ? 'Course Full' : 'Enroll'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseList;