const Project = require('../models/Project')

const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.params.id
      const project = await Project.findById(projectId)

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      const role = project.getMemberRole(req.user.userId)

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this project'
        })
      }

      if (!roles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to perform this action'
        })
      }

      req.project = project
      req.userRole = role
      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = { requireRole }