const express = require('express')
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  inviteMember,
  changeMemberRole,
  removeMember
} = require('../controllers/project.controller')
const { protect } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/rbac.middleware')

const router = express.Router()

router.use(protect)

router.post('/', createProject)
router.get('/', getProjects)
router.get('/:id', getProject)
router.put('/:id', requireRole('owner'), updateProject)
router.delete('/:id', requireRole('owner'), deleteProject)

router.post('/:id/invite', requireRole('owner'), inviteMember)
router.put('/:id/members/:userId/role', requireRole('owner'), changeMemberRole)
router.delete('/:id/members/:userId', requireRole('owner'), removeMember)

module.exports = router