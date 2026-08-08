'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Plus, MessageCircle, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useParams } from 'next/navigation'

interface Task {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed'
  dueDate: string
}

interface Document {
  id: string
  name: string
  type: string
  uploadedDate: string
}

interface Comment {
  id: string
  author: string
  text: string
  timestamp: string
}

interface MatterDetail {
  id: string
  name: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in-progress' | 'completed'
  progress: number
  description: string
  dueDate: string
  createdDate: string
  organization: string
}

const priorityColors = {
  low: 'text-blue-500 bg-blue-500/10',
  medium: 'text-yellow-500 bg-yellow-500/10',
  high: 'text-orange-500 bg-orange-500/10',
  urgent: 'text-red-500 bg-red-500/10',
}

export default function MatterDetailPage() {
  const params = useParams()
  const matterId = params.id as string

  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'comments'>('overview')
  const [tasks, setTasks] = useState<Task[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')

  const matter: MatterDetail = {
    id: matterId,
    name: 'New Legal Matter',
    category: 'Contract Review',
    priority: 'high',
    status: 'open',
    progress: 0,
    description: 'This is a newly created legal matter. Start adding tasks and documents.',
    dueDate: '2026-08-21',
    createdDate: '2026-07-22',
    organization: 'Your Organization',
  }

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  const handleAddTask = () => {
    const newTask: Task = {
      id: generateId(),
      title: '',
      status: 'pending',
      dueDate: '',
    }
    setTasks([...tasks, newTask])
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const comment: Comment = {
      id: generateId(),
      author: 'You',
      text: newComment,
      timestamp: new Date().toLocaleString(),
    }
    setComments([...comments, comment])
    setNewComment('')
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: AlertCircle },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckCircle2 },
    { id: 'documents' as const, label: 'Documents', icon: FileText },
    { id: 'comments' as const, label: 'Comments', icon: MessageCircle },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard/matters"
            className="p-2 hover:bg-card rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-display-lg font-bold text-foreground mb-2">{matter.name}</h1>
            <p className="text-body-md">{matter.organization}</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-label-md mb-2">Status</p>
            <p className="text-heading-xs font-semibold text-foreground capitalize">{matter.status}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-label-md mb-2">Priority</p>
            <p className={`text-heading-xs font-semibold capitalize ${priorityColors[matter.priority]}`}>
              {matter.priority}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-label-md mb-2">Progress</p>
            <p className="text-heading-xs font-semibold text-foreground">{matter.progress}%</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-label-md mb-2">Category</p>
            <p className="text-heading-xs font-semibold text-foreground">{matter.category}</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 border-b border-border overflow-x-auto"
      >
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-heading-sm font-semibold text-foreground mb-3">Description</h2>
              <p className="text-body-md">{matter.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-label-lg mb-3">Due Date</h3>
                <p className="text-heading-xs font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {new Date(matter.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-label-lg mb-3">Created</h3>
                <p className="text-heading-xs font-semibold text-foreground">
                  {new Date(matter.createdDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-body-md text-muted-foreground mb-4">No tasks yet</p>
                <button
                  onClick={handleAddTask}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  Add Your First Task
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        className="w-5 h-5 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-body-md font-medium text-foreground">{task.title || 'Untitled Task'}</p>
                        {task.dueDate && (
                          <p className="text-body-sm text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddTask}
                  className="w-full px-4 py-2 border border-border text-body-md font-semibold text-foreground rounded-lg hover:bg-card transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-body-md text-muted-foreground mb-4">No documents yet</p>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors">
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-body-md font-medium text-foreground">{doc.name}</p>
                      <p className="text-body-sm text-muted-foreground">{doc.uploadedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* Add Comment */}
            <div className="bg-card border border-border rounded-lg p-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-body-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none h-24"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Comment
              </button>
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-body-md text-muted-foreground">No comments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-body-md font-semibold text-foreground">{comment.author}</p>
                      <p className="text-body-sm text-muted-foreground">{comment.timestamp}</p>
                    </div>
                    <p className="text-body-md text-foreground">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
