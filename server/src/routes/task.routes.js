const express = require('express')
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  getActivityFeed
} = require('../controllers/task.controller')
const { protect } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/rbac.middleware')

const router = express.Router({ mergeParams: true })

router.use(protect)
router.use(requireRole('owner', 'member', 'viewer'))

router.get('/activity', getActivityFeed)

router.route('/')
  .post(requireRole('owner', 'member'), createTask)
  .get(getTasks)

router.route('/:taskId')
  .get(getTask)
  .put(requireRole('owner', 'member'), updateTask)
  .delete(requireRole('owner', 'member'), deleteTask)

router.post('/:taskId/comments', requireRole('owner', 'member'), addComment)

module.exports = router