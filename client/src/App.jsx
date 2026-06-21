import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
        <Route path="/login" element={<div>Login page coming soon</div>} />
        <Route path="/register" element={<div>Register page coming soon</div>} />
        <Route path="/dashboard" element={<div>Dashboard coming soon</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App