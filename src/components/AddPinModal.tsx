'use client'

import { useState, useEffect } from 'react'
import { PinData } from '@/types'

interface AddPinModalProps {
  lat: number
  lng: number
  onClose: () => void
  onPinCreated: (pin: PinData) => void
}

export default function AddPinModal({ lat, lng, onClose, onPinCreated }: AddPinModalProps) {
  const [authorName, setAuthorName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedName = localStorage.getItem('userDisplayName')
    if (storedName) {
      setAuthorName(storedName)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authorName.trim() || !title.trim() || !description.trim()) return

    setSubmitting(true)
    setError(null)

    // Save name if not already saved (implied first time use)
    if (!localStorage.getItem('userDisplayName')) {
      localStorage.setItem('userDisplayName', authorName.trim())
    }

    try {
      const res = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          title: title.trim(),
          description: description.trim(),
          authorName: authorName.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to create pin')

      const newPin = await res.json()
      onPinCreated(newPin)
      onClose()
    } catch (err) {
      setError('Failed to create pin. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // Check if name was stored (for UI state)
  // We check state 'authorName' against localStorage to know if it came from storage or user input, 
  // but simpler is just checking if storage existed on mount.
  // Actually, for the UI requirement "remove name field if the name is already filled in localstorage",
  // we can just check if we have a stored value.
  const isNameStored = typeof window !== 'undefined' && !!localStorage.getItem('userDisplayName')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-modal-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
            <h2 className="text-lg font-semibold text-gray-800">Add New Location</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Coordinates display */}
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-blue-700">
                <span className="font-medium">Selected Location:</span>
              </p>
              <p className="text-blue-600 font-mono text-xs mt-1">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            </div>

            {/* Your Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              {isNameStored ? (
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-gray-900 font-medium">{authorName}</span>
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">Stored</span>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location Title *
              </label>
              <input
                type="text"
                placeholder="e.g., Mountain Village - John's Place"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                placeholder="Describe this location and how to reach it. Include any helpful details for visitors..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !authorName.trim() || !title.trim() || !description.trim()}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Adding...' : 'Add Location'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-modal-in {
          animation: modal-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
}
