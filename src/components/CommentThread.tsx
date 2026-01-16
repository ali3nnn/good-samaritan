'use client'

import { useState, useEffect } from 'react'
import { CommentData } from '@/types'
import { generateRandomName } from '@/lib/nameGenerator'

interface CommentThreadProps {
  pinId: string
  comments: CommentData[]
  onCommentAdded: (comment: CommentData) => void
}

export default function CommentThread({ pinId, comments, onCommentAdded }: CommentThreadProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')

  // Load or generate username on mount
  useEffect(() => {
    const storedName = localStorage.getItem('userDisplayName')
    if (storedName) {
      setUserName(storedName)
    } else {
      const newName = generateRandomName()
      // We don't save the random name to localStorage anymore to avoid overwriting a potential future user preference
      // or we can save it if we want "guest" persistence?
      // Let's stick to the current behavior: save unique guest name so they stay consistent in this session/browser
      localStorage.setItem('userDisplayName', newName)
      setUserName(newName)
    }
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/pins/${pinId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: userName, content: content.trim() }),
      })

      if (!res.ok) throw new Error('Failed to post comment')

      const newComment = await res.json()

      onCommentAdded(newComment)
      setContent('')
    } catch (err) {
      setError('Failed to post comment. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Add Comment Form - at top */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={userName ? `Comment as ${userName}...` : 'Write a comment...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            required
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Send comment"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-800 text-sm">
                  {comment.authorName}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
