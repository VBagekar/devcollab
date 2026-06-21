import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user, accessToken) => {
    localStorage.setItem('accessToken', accessToken)
    set({ user, accessToken, isAuthenticated: true })
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken')
    set({ user: null, accessToken: null, isAuthenticated: false })
  },
}))

export default useAuthStore