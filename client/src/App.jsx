import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<div className="p-8 text-gray-900 font-medium">Dashboard coming soon</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App