import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import TaskDrawer from '../components/TaskDrawer'
import api from '../api/axios'

const COLUMNS = [
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
]

export default function ProjectBoard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskColumn, setNewTaskColumn] = useState('todo')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/projects/${id}/tasks`),
      ])
      setProject(projectRes.data.data.project)
      setTasks(tasksRes.data.data.tasks)
    } catch {
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getTasksByStatus = (status) => {
    return tasks.filter((t) => t.status === status)
  }

  const handleCreateTask = async (status) => {
    if (!newTaskTitle.trim()) return
    try {
      setCreating(true)
      const res = await api.post(`/api/projects/${id}/tasks`, {
        title: newTaskTitle,
        status,
      })
      setTasks([res.data.data.task, ...tasks])
      setNewTaskTitle('')
      setShowNewTask(false)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleTaskUpdate = (updatedTask) => {
    setTasks(tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)))
    setSelectedTask(updatedTask)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-14 flex items-center justify-center h-screen">
          <div className="text-sm text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="pt-14">
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-base font-semibold text-gray-900">{project?.name}</h1>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {tasks.length} tasks
              </span>
            </div>

            <button
              onClick={() => {
                setNewTaskColumn('todo')
                setShowNewTask(true)
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const colTasks = getTasksByStatus(col.id)
              return (
                <div key={col.id} className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {col.label}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setNewTaskColumn(col.id)
                        setShowNewTask(true)
                      }}
                      className="text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 min-h-32">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                      />
                    ))}

                    {showNewTask && newTaskColumn === col.id && (
                      <div className="bg-white border border-blue-300 rounded-lg p-3">
                        <input
                          autoFocus
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateTask(col.id)
                            if (e.key === 'Escape') setShowNewTask(false)
                          }}
                          placeholder="Task title..."
                          className="w-full text-sm outline-none text-gray-900 placeholder-gray-400"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleCreateTask(col.id)}
                            disabled={creating || !newTaskTitle.trim()}
                            className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2.5 py-1 rounded-md transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setShowNewTask(false)
                              setNewTaskTitle('')
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {colTasks.length === 0 && !showNewTask && (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-400">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          projectId={id}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  )
}