const priorityConfig = {
  high: { color: 'text-red-500', bg: 'bg-red-50', label: 'High' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-50', label: 'Medium' },
  low: { color: 'text-gray-400', bg: 'bg-gray-50', label: 'Low' },
}

export default function TaskCard({ task, onClick }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium

  const isOverdue =
    task.dueDate &&
    task.status !== 'done' &&
    new Date(task.dueDate) < new Date()

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${priority.bg} ${priority.color}`}>
          {priority.label}
        </span>
        {task.dueDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
        {task.title}
      </p>

      {task.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-3">
        {task.assigneeId ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs font-medium">
                {getInitials(task.assigneeId.name)}
              </span>
            </div>
            <span className="text-xs text-gray-500">{task.assigneeId.name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-300">Unassigned</span>
        )}

        {task.comments?.length > 0 && (
          <div className="flex items-center gap-1 text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">{task.comments.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}