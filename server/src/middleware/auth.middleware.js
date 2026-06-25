const { verifyAccessToken } = require('../utils/jwt')

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    console.log('Auth header:', authHeader ? 'present' : 'missing')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    console.log('Decoded userId:', decoded.userId)

    req.user = {
      userId: decoded.userId,
      email: decoded.email
    }

    next()
  } catch (error) {
    console.log('Auth error:', error.message)
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

module.exports = { protect }