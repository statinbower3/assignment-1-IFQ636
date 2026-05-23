import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

const MyCourses = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await axiosInstance.get('/api/enrollments/my', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setEnrollments(response.data);
      } catch (error) {
        setMessage('Failed to load enrollments');
      }
    };
    fetchEnrollments();
  }, [user]);

  const handleDrop = async (courseId) => {
    try {
      await axiosInstance.delete(`/api/enrollments/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setMessage('Course dropped successfully');
      setEnrollments(enrollments.filter(e => e.course._id !== courseId));
    } catch (error) {
      setMessage('Failed to drop course');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Courses</h1>
      {message && (
        <div className="bg-blue-100 text-blue-800 p-3 rounded mb-4">{message}</div>
      )}
      {enrollments.length === 0 ? (
        <p className="text-gray-500">You haven't enrolled in any courses yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <div key={enrollment._id} className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-bold mb-2">{enrollment.course.title}</h2>
              <p className="text-gray-600 mb-2">{enrollment.course.description}</p>
              <p className="text-sm text-gray-500 mb-1">👨‍🏫 {enrollment.course.instructor}</p>
              <p className="text-sm text-gray-500 mb-1">📅 {enrollment.course.schedule}</p>
              <p className="text-sm text-gray-500 mb-4">
                Enrolled on: {new Date(enrollment.enrolledAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => handleDrop(enrollment.course._id)}
                className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-700"
              >
                Drop Course
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;