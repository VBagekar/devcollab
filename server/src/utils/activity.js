const ActivityLog = require('../models/ActivityLog')

const logActivity = async (projectId, userId, action, metadata = {}) => {
  try {
    await ActivityLog.create({
      projectId,
      userId,
      action,
      metadata
    })
  } catch (error) {
    console.error('Failed to write activity log:', error.message)
  }
}

module.exports = { logActivity }