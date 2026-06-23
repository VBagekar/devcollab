const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.routes')
const projectRoutes = require('./routes/project.routes')
const { protect } = require('./middleware/auth.middleware')
const taskRoutes = require('./routes/task.routes')

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/projects/:projectId/tasks', taskRoutes)

app.get('/api/test-protected', protect, (req, res) => {
  res.json({ success: true, message: `Hello ${req.user.email}` })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

module.exports = app