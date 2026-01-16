'use client'

import { useState, useEffect } from 'react'

interface SetProfileModalProps {
    onClose: () => void
    onSave: (name: string) => void
}

export default function SetProfileModal({ onClose, onSave }: SetProfileModalProps) {
    const [name, setName] = useState('')

    useEffect(() => {
        const storedName = localStorage.getItem('userDisplayName')
        if (storedName) {
            setName(storedName)
        }
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            localStorage.setItem('userDisplayName', name.trim())
            onSave(name.trim())
            onClose()
        }
    }

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-modal-in"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Your Profile</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Display Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                maxLength={50}
                                required
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1">This name will be used for your pins and comments.</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!name.trim()}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                            >
                                Save Name
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-in {
          animation: modal-in 0.2s ease-out;
        }
      `}</style>
        </>
    )
}
