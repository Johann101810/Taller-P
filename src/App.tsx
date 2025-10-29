import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/student/Dashboard';
import Runner from './pages/eval/Runner';
import { RequireAuth } from './context/AuthContext';

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login/>} />
        <Route path="/" element={<RequireAuth><StudentDashboard/></RequireAuth>} />
        <Route path="/evaluate/:instrumentId" element={<RequireAuth><Runner/></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace/>} />
      </Routes>
    </BrowserRouter>
  );
}
