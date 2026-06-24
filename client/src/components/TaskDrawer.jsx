import { useState, useEffect } from 'react'
import api from '../api/axios'

const statusOptions = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export default function TaskDrawer({ task, projectId, onClose, onUpdate }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
  })
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingComment, setAddingComment] = useState(false)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await api.put(
        `/api/projects/${projectId}/tasks/${task._id}`,
        form
      )
      onUpdate(res.data.data.task)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) return
    try {
      setAddingComment(true)
      await api.post(
        `/api/projects/${projectId}/tasks/${task._id}/comments`,
        { text: comment }
      )
      setComment('')
      const res = await api.get(
        `/api/projects/${projectId}/tasks/${task._id}`
      )
      onUpdate(res.data.data.task)
    } catch (err) {
      console.error(err)
    } finally {
      setAddingComment(false)
    }
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/30"
        onClick={onClose}
      />
      <div className="w-full max-w-lg bg-white shadow-xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Task details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full text-sm font-medium text-gray-900 border-0 border-b border-gray-200 pb-1 outline-none focus:border-blue-500 bg-transparent transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 bg-white"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 bg-white"
              >
                {priorityOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Add a description..."
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-xs font-medium text-gray-500 mb-3">
              Comments {task.comments?.length > 0 && `(${task.comments.length})`}
            </h3>

            {task.comments?.length > 0 ? (
              <div className="space-y-3 mb-4">
                {task.comments.map((c) => (
                  <div key={c._id} className="flex gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-xs font-medium">
                        {c.userId?.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-700">
                          {c.userId?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mb-4">No comments yet</p>
            )}

            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={!comment.trim() || addingComment}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                Post
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}