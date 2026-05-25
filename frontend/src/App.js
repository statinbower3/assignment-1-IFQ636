import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CourseList from './pages/CourseList';
import MyCourses from './pages/MyCourses';
import AdminPanel from './pages/AdminPanel';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<CourseList />} />
        <Route path="/courses" element={<CourseList />} />
        <Route path="/my-courses" element={<MyCourses />} />
        <Route
          path="/admin"
          element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/courses" />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;