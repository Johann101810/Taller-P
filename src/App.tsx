import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './context/AuthContext';
import { RequireRole } from './context/RequireRole';
import StudentDashboard from './pages/student/Dashboard';
import PsychDashboard from './pages/psych/Dashboard';
import AdminPanel from './pages/admin/Panel';
import Runner from './pages/eval/Runner';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Student */}
        <Route path="/"
          element={<RequireAuth><RequireRole allow={['student','psych','admin']}><StudentDashboard/></RequireRole></RequireAuth>}
        />

        {/* Psych */}
        <Route path="/psych"
          element={<RequireAuth><RequireRole allow={['psych','admin']}><PsychDashboard/></RequireRole></RequireAuth>}
        />

        {/* Admin */}
        <Route path="/admin"
          element={<RequireAuth><RequireRole allow={['admin']}><AdminPanel/></RequireRole></RequireAuth>}
        />

        <Route path="/evaluate/:instrumentId"
          element={<RequireAuth><RequireRole allow={['student','psych','admin']}><Runner/></RequireRole></RequireAuth>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
