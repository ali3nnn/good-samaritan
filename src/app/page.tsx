'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'
import AddPinModal from '@/components/AddPinModal'
import SetProfileModal from '@/components/SetProfileModal'
import { PinData } from '@/types'

// Dynamic import to avoid SSR issues with OpenLayers
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

export default function Home() {
  const [pins, setPins] = useState<PinData[]>([])
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [addPinCoords, setAddPinCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locatingUser, setLocatingUser] = useState(false)
  const [shouldZoomToUser, setShouldZoomToUser] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Load display name on mount
  useEffect(() => {
    const storedName = localStorage.getItem('userDisplayName')
    if (storedName) {
      setDisplayName(storedName)
    }
  }, [])

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (err) => {
          console.error('Geolocation error:', err)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }, [])

  // Fetch all pins on mount
  useEffect(() => {
    const fetchPins = async () => {
      try {
        const res = await fetch('/api/pins')
        if (!res.ok) throw new Error('Failed to fetch pins')
        const data = await res.json()
        setPins(data)
      } catch (err) {
        setError('Failed to load pins. Please refresh the page.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPins()
  }, [])

  const handlePinClick = useCallback((pin: PinData) => {
    setSelectedPinId(pin.id)
  }, [])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setAddPinCoords({ lat, lng })
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setSelectedPinId(null)
  }, [])

  const handleCloseModal = useCallback(() => {
    setAddPinCoords(null)
  }, [])

  const handlePinCreated = useCallback((newPin: PinData) => {
    setPins((prev) => [newPin, ...prev])
  }, [])

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setLocatingUser(true)
    setShouldZoomToUser(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocatingUser(false)
      },
      (err) => {
        console.error('Geolocation error:', err)
        alert('Unable to get your location. Please check your browser permissions.')
        setLocatingUser(false)
        setShouldZoomToUser(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const handleProfileSave = useCallback((name: string) => {
    setDisplayName(name)
  }, [])

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="h-screen w-screen relative">
      {/* Map */}
      <MapComponent
        pins={pins}
        onPinClick={handlePinClick}
        onMapClick={handleMapClick}
        selectedPinId={selectedPinId}
        userLocation={userLocation}
        isAddMode={isAddMode}
        setIsAddMode={setIsAddMode}
        shouldZoomToUser={shouldZoomToUser}
        onZoomComplete={() => setShouldZoomToUser(false)}
      />

      {/* Header - hidden on mobile */}
      <header className="hidden mobile:flex absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Good Samaritan</h1>
          <p className="text-xs text-gray-500">Find remote people, make connections</p>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          title={displayName ? `Logged in as ${displayName}` : 'Set your name'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </button>
      </header>

      {/* Pin count badge - hidden on mobile */}
      <div className="hidden mobile:block absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-full shadow-lg px-3 py-2">
        <span className="text-sm text-gray-600">
          <span className="font-semibold text-blue-500">{pins.length}</span> locations
        </span>
      </div>

      {/* Mobile hamburger menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="mobile:hidden absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="mobile:hidden absolute top-16 right-4 z-20 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[200px]">
          {/* Title section */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h1 className="text-lg font-bold text-gray-800">Good Samaritan</h1>
            <p className="text-xs text-gray-500">Find remote people, make connections</p>
          </div>

          {/* Location count */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-blue-500">{pins.length}</span> locations
            </span>
          </div>

          {/* Menu items */}
          <div className="space-y-2">
            {/* Profile button */}
            <button
              onClick={() => {
                setShowProfileModal(true)
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span>{displayName || 'Set Profile'}</span>
            </button>

            {/* Locate Me button */}
            <button
              onClick={() => {
                handleLocateMe()
                setMobileMenuOpen(false)
              }}
              disabled={locatingUser}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {locatingUser ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 11.5l19-9-9 19-2-8-8-2z" />
                </svg>
              )}
              <span>Locate Me</span>
            </button>

            {/* Add Location button */}
            <button
              onClick={() => {
                setIsAddMode(true)
                setMobileMenuOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${isAddMode
                ? 'bg-red-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{isAddMode ? 'Adding location...' : 'Add Location'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom right buttons - hidden on mobile */}
      <div className="hidden mobile:flex absolute bottom-6 right-6 z-10 items-center gap-3">
        {/* Locate Me Button */}
        <button
          onClick={handleLocateMe}
          disabled={locatingUser}
          className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg p-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Find my location"
        >
          {locatingUser ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 11.5l19-9-9 19-2-8-8-2z" />
            </svg>
          )}
        </button>

        {/* Add Location Button */}
        <button
          onClick={() => setIsAddMode(true)}
          className={`px-6 py-3 rounded-full font-semibold shadow-lg transition-all ${isAddMode
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isAddMode ? 'Click on map to add pin' : '+ Add Location'}
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar pinId={selectedPinId} onClose={handleCloseSidebar} />

      {/* Add Pin Modal */}
      {addPinCoords && (
        <AddPinModal
          lat={addPinCoords.lat}
          lng={addPinCoords.lng}
          onClose={handleCloseModal}
          onPinCreated={handlePinCreated}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <SetProfileModal
          onClose={() => setShowProfileModal(false)}
          onSave={handleProfileSave}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 z-30 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading locations...</p>
          </div>
        </div>
      )}
    </main>
  )
}
