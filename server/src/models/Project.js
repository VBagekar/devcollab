const mongoose = require('mongoose')

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'member', 'viewer'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
)

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    members: {
      type: [memberSchema],
      default: []
    },
    taskCounts: {
      todo: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      done: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
)

projectSchema.index({ 'members.userId': 1 })

projectSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find(
    (m) => m.userId.toString() === userId.toString()
  )
  return member ? member.role : null
}

projectSchema.methods.isMember = function (userId) {
  return this.members.some(
    (m) => m.userId.toString() === userId.toString()
  )
}

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema)
module.exports = Project