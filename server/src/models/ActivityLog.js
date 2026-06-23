const mongoose = require('mongoose')

const activityLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: [
        'task:created',
        'task:updated',
        'task:moved',
        'task:assigned',
        'task:deleted',
        'task:commented',
        'member:invited',
        'member:removed',
        'member:role_changed'
      ],
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
)

activityLogSchema.index({ projectId: 1, createdAt: -1 })
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 }
)

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema)

module.exports = ActivityLog