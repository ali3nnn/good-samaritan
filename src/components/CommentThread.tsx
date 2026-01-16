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
      {/* Comments List */}
      <div className="space-y-4 mb-6">
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

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="border-t pt-4">
        <div className="mb-3">
          <textarea
            placeholder={userName ? `Write a comment as ${userName}...` : 'Write a comment...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm resize-none"
            required
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  )
}
