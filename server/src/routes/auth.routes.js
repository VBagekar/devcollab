const express = require('express')
const { register, login, refresh, logout, registerSchema, loginSchema } = require('../controllers/auth.controller')
const validate = require('../middleware/validate')

const router = express.Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', refresh)
router.post('/logout', logout)

module.exports = router