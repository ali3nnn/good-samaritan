'use client'

import { useEffect, useState } from 'react'
import { PinWithComments, CommentData } from '@/types'
import CommentThread from './CommentThread'

interface SidebarProps {
  pinId: string | null
  onClose: () => void
}

export default function Sidebar({ pinId, onClose }: SidebarProps) {
  const [pin, setPin] = useState<PinWithComments | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pinId) {
      setPin(null)
      return
    }

    const fetchPin = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/pins/${pinId}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch pin')
        const data = await res.json()
        console.log(data)
        setPin(data)
      } catch (err) {
        setError('Failed to load pin details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPin()
  }, [pinId])

  const handleCommentAdded = (newComment: CommentData) => {
    if (pin) {
      setPin({
        ...pin,
        comments: [newComment, ...pin.comments],
      })
    }
  }

  if (!pinId) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-0 md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-[400px] bg-white z-50 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Location Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Close sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          )}

          {error && (
            <div className="p-4 text-red-500 text-center">{error}</div>
          )}

          {pin && !loading && (
            <div className="p-4">
              {/* Pin Info */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {pin.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Added by <span className="font-medium">{pin.authorName}</span> on {formatDate(pin.createdAt)}
                </p>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {pin.description}
                </p>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-400">
                    Coordinates: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
                  </p>
                </div>
              </div>

              {/* Comments Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Comments ({pin.comments.length})
                </h4>
                <CommentThread
                  pinId={pin.id}
                  comments={pin.comments}
                  onCommentAdded={handleCommentAdded}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @media (max-width: 767px) {
          @keyframes slide-in {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
