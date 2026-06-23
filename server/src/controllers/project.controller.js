const { z } = require('zod')
const Project = require('../models/Project')
const User = require('../models/User')
const { logActivity } = require('../utils/activity')

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional().default('')
})

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional()
})

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['member', 'viewer'])
})

const createProject = async (req, res, next) => {
  try {
    const { name, description } = createProjectSchema.parse(req.body)

    const project = await Project.create({
      name,
      description,
      members: [
        {
          userId: req.user.userId,
          role: 'owner'
        }
      ]
    })

    await logActivity(project._id, req.user.userId, 'member:invited', {
      note: 'Project created'
    })

    return res.status(201).json({
      success: true,
      data: { project }
    })
  } catch (error) {
    next(error)
  }
}

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      'members.userId': req.user.userId
    }).sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      data: { projects }
    })
  } catch (error) {
    next(error)
  }
}

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'members.userId',
      'name email avatar'
    )

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    if (!project.isMember(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project'
      })
    }

    return res.status(200).json({
      success: true,
      data: { project }
    })
  } catch (error) {
    next(error)
  }
}

const updateProject = async (req, res, next) => {
  try {
    const updates = updateProjectSchema.parse(req.body)

    const project = req.project
    Object.assign(project, updates)
    await project.save()

    return res.status(200).json({
      success: true,
      data: { project }
    })
  } catch (error) {
    next(error)
  }
}

const deleteProject = async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.params.id)

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

const inviteMember = async (req, res, next) => {
  try {
    const { email, role } = inviteMemberSchema.parse(req.body)

    const userToInvite = await User.findOne({ email })
    if (!userToInvite) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email'
      })
    }

    const project = req.project

    if (project.isMember(userToInvite._id)) {
      return res.status(409).json({
        success: false,
        message: 'This user is already a member of the project'
      })
    }

    project.members.push({
      userId: userToInvite._id,
      role
    })
    await project.save()

    await logActivity(project._id, req.user.userId, 'member:invited', {
      invitedUserId: userToInvite._id,
      invitedUserName: userToInvite.name,
      role
    })

    return res.status(200).json({
      success: true,
      message: `${userToInvite.name} has been added to the project`
    })
  } catch (error) {
    next(error)
  }
}

const changeMemberRole = async (req, res, next) => {
  try {
    const { role } = z.object({
      role: z.enum(['member', 'viewer'])
    }).parse(req.body)

    const { userId } = req.params
    const project = req.project

    const member = project.members.find(
      (m) => m.userId.toString() === userId
    )

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project'
      })
    }

    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change the role of the project owner'
      })
    }

    member.role = role
    await project.save()

    await logActivity(project._id, req.user.userId, 'member:role_changed', {
      targetUserId: userId,
      newRole: role
    })

    return res.status(200).json({
      success: true,
      message: 'Member role updated'
    })
  } catch (error) {
    next(error)
  }
}

const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params
    const project = req.project

    const member = project.members.find(
      (m) => m.userId.toString() === userId
    )

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in this project'
      })
    }

    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the project owner'
      })
    }

    project.members = project.members.filter(
      (m) => m.userId.toString() !== userId
    )
    await project.save()

    await logActivity(project._id, req.user.userId, 'member:removed', {
      removedUserId: userId
    })

    return res.status(200).json({
      success: true,
      message: 'Member removed from project'
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  inviteMember,
  changeMemberRole,
  removeMember
}