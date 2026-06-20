const { z } = require('zod')
const User = require('../models/User')
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/jwt')

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
}

const register = async (req, res, next) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body)

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      })
    }

    const user = new User({ name, email, passwordHash: password })
    await user.save()

    const accessToken = generateAccessToken(user._id, user.email)
    const refreshToken = generateRefreshToken(user._id)

    user.refreshTokens.push(refreshToken)
    await user.save()

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

    return res.status(201).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        accessToken
      }
    })
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const accessToken = generateAccessToken(user._id, user.email)
    const refreshToken = generateRefreshToken(user._id)

    user.refreshTokens.push(refreshToken)
    await user.save()

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

    return res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        accessToken
      }
    })
  } catch (error) {
    next(error)
  }
}

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      })
    }

    const decoded = verifyRefreshToken(token)

    const user = await User.findById(decoded.userId)
    if (!user || !user.refreshTokens.includes(token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }

    const newAccessToken = generateAccessToken(user._id, user.email)

    return res.status(200).json({
      success: true,
      data: { accessToken: newAccessToken }
    })
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken
    if (token) {
      const user = await User.findOne({ refreshTokens: token })
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== token)
        await user.save()
      }
    }

    res.clearCookie('refreshToken', COOKIE_OPTIONS)

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = { register, login, refresh, logout, registerSchema, loginSchema }