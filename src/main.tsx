import 'bootstrap'; // activa componentes JS (dropdowns, modals, etc.)
import 'bootstrap-icons/font/bootstrap-icons.css';
// ❌ import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.scss';
import 'bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { AuthProvider } from './context/AuthContext';
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
