import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuthStore from '../stores/authStore'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default function Register() {
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setServerError('')
      const res = await api.post('/api/auth/register', data)
      setAuth(res.data.data.user, res.data.data.accessToken)
      navigate('/dashboard')
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Something went wrong. Try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">D</span>
            </div>
            <span className="text-white font-semibold text-lg">DevCollab</span>
          </div>
        </div>
        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Ship faster<br />with your team.
          </h1>
          <p className="text-blue-200 text-lg">
            Kanban boards, real-time updates, and team collaboration in one place.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Real-time sync', desc: 'See changes instantly' },
            { label: 'Role-based access', desc: 'Owner, member, viewer' },
            { label: 'Activity feed', desc: 'Track every change' },
            { label: 'Smart analytics', desc: 'Cached for speed' },
          ].map((f) => (
            <div key={f.label} className="bg-white/10 rounded-lg p-3">
              <p className="text-white text-sm font-medium">{f.label}</p>
              <p className="text-blue-200 text-xs mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-gray-900 font-semibold text-lg">DevCollab</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-500 mt-1">Start collaborating in minutes</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="Vaishnavi Bagekar"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="Min. 8 characters"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-red-600 text-sm">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}