const { z } = require('zod')
const Task = require('../models/Task')
const { logActivity } = require('../utils/activity')

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable()
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable()
})

const createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const data = createTaskSchema.parse(req.body)

    const task = await Task.create({
      projectId,
      createdBy: req.user.userId,
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null
    })

    await logActivity(projectId, req.user.userId, 'task:created', {
      taskId: task._id,
      taskTitle: task.title
    })

    return res.status(201).json({
      success: true,
      data: { task }
    })
  } catch (error) {
    next(error)
  }
}

const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { status, priority, assigneeId } = req.query

    const filter = { projectId }
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (assigneeId) filter.assigneeId = assigneeId

    const tasks = await Task.find(filter)
      .populate('assigneeId', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      data: { tasks }
    })
  } catch (error) {
    next(error)
  }
}

const getTask = async (req, res, next) => {
  try {
    const { taskId } = req.params

    const task = await Task.findById(taskId)
      .populate('assigneeId', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('comments.userId', 'name email avatar')

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      })
    }

    return res.status(200).json({
      success: true,
      data: { task }
    })
  } catch (error) {
    next(error)
  }
}

const updateTask = async (req, res, next) => {
  try {
    const { taskId, projectId } = req.params
    const updates = updateTaskSchema.parse(req.body)

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      })
    }

    const previousStatus = task.status

    if (updates.status && updates.status !== previousStatus) {
      if (updates.status === 'done') {
        task.completedAt = new Date()
      } else {
        task.completedAt = null
      }

      await logActivity(projectId, req.user.userId, 'task:moved', {
        taskId: task._id,
        taskTitle: task.title,
        from: previousStatus,
        to: updates.status
      })
    } else {
      await logActivity(projectId, req.user.userId, 'task:updated', {
        taskId: task._id,
        taskTitle: task.title
      })
    }

    if (updates.assigneeId !== undefined &&
        updates.assigneeId !== task.assigneeId?.toString()) {
      await logActivity(projectId, req.user.userId, 'task:assigned', {
        taskId: task._id,
        taskTitle: task.title,
        assigneeId: updates.assigneeId
      })
    }

    Object.assign(task, {
      ...updates,
      dueDate: updates.dueDate !== undefined
        ? (updates.dueDate ? new Date(updates.dueDate) : null)
        : task.dueDate,
      assigneeId: updates.assigneeId !== undefined
        ? (updates.assigneeId || null)
        : task.assigneeId
    })

    await task.save()

    return res.status(200).json({
      success: true,
      data: { task }
    })
  } catch (error) {
    next(error)
  }
}

const deleteTask = async (req, res, next) => {
  try {
    const { taskId, projectId } = req.params

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      })
    }

    await Task.findByIdAndDelete(taskId)

    await logActivity(projectId, req.user.userId, 'task:deleted', {
      taskId,
      taskTitle: task.title
    })

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

const addComment = async (req, res, next) => {
  try {
    const { taskId, projectId } = req.params
    const { text } = z.object({
      text: z.string().min(1, 'Comment cannot be empty').max(1000)
    }).parse(req.body)

    const task = await Task.findById(taskId)
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      })
    }

    task.comments.push({
      userId: req.user.userId,
      text
    })

    await task.save()

    await logActivity(projectId, req.user.userId, 'task:commented', {
      taskId,
      taskTitle: task.title
    })

    return res.status(201).json({
      success: true,
      data: { comment: task.comments[task.comments.length - 1] }
    })
  } catch (error) {
    next(error)
  }
}

const getActivityFeed = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const ActivityLog = require('../models/ActivityLog')

    const logs = await ActivityLog.find({ projectId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50)

    return res.status(200).json({
      success: true,
      data: { logs }
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  getActivityFeed
}