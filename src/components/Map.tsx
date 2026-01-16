'use client'

import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { Cluster } from 'ol/source'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import { fromLonLat, toLonLat } from 'ol/proj'
import Feature, { FeatureLike } from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style, Fill, Stroke, Circle as CircleStyle, Text, RegularShape } from 'ol/style'
import { createEmpty, extend } from 'ol/extent'
import { PinData } from '@/types'
import 'ol/ol.css'

interface MapComponentProps {
  pins: PinData[]
  onPinClick: (pin: PinData) => void
  onMapClick: (lat: number, lng: number) => void
  selectedPinId: string | null
  userLocation?: { lat: number; lng: number } | null
  userHeading?: number | null
  isAddMode: boolean
  setIsAddMode: (mode: boolean) => void
  shouldZoomToUser?: boolean
  onZoomComplete?: () => void
  isSatelliteView?: boolean
}

export default function MapComponent({ pins, onPinClick, onMapClick, selectedPinId, userLocation, userHeading, isAddMode, setIsAddMode, shouldZoomToUser, onZoomComplete, isSatelliteView }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const vectorSourceRef = useRef<VectorSource | null>(null)
  const clusterSourceRef = useRef<Cluster | null>(null)
  const userLocationSourceRef = useRef<VectorSource | null>(null)
  const tileLayerRef = useRef<TileLayer<OSM | XYZ> | null>(null)
  const labelsLayerRef = useRef<TileLayer<XYZ> | null>(null)
  const placesLayerRef = useRef<TileLayer<XYZ> | null>(null)
  const userHeadingRef = useRef<number | null>(null)
  const isAddModeRef = useRef(false)
  const setIsAddModeRef = useRef(setIsAddMode)

  // Systematically create styles
  const styleCache = useRef<Record<string, Style>>({})

  const getStyle = (feature: FeatureLike, resolution: number) => {
    const size = feature.get('features').length

    // Single feature (Pin)
    if (size === 1) {
      const originalFeature = feature.get('features')[0]
      const pinData = originalFeature.get('pinData')
      const isSelected = pinData.id === selectedPinId

      const styleKey = `pin-${isSelected}`
      if (!styleCache.current[styleKey]) {
        styleCache.current[styleKey] = new Style({
          image: new CircleStyle({
            radius: isSelected ? 12 : 10,
            fill: new Fill({ color: isSelected ? '#ef4444' : '#3b82f6' }),
            stroke: new Stroke({ color: 'white', width: 3 }),
          }),
        })
      }
      return styleCache.current[styleKey]
    }

    // Cluster
    let style = styleCache.current[size]
    if (!style) {
      style = new Style({
        image: new CircleStyle({
          radius: 15 + Math.min(size, 20) * 0.5, // dynamic size
          stroke: new Stroke({ color: '#fff', width: 2 }),
          fill: new Fill({ color: '#3b82f6' }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({ color: '#fff' }),
          font: 'bold 12px sans-serif',
        }),
      })
      styleCache.current[size] = style
    }
    return style
  }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const vectorSource = new VectorSource()
    vectorSourceRef.current = vectorSource

    // Cluster source wraps the vector source
    const clusterSource = new Cluster({
      distance: 40,
      minDistance: 20,
      source: vectorSource,
    })
    clusterSourceRef.current = clusterSource

    const vectorLayer = new VectorLayer({
      source: clusterSource,
      style: getStyle,
    })

    // User location layer (separate from clusters) with animated halo
    const userLocationSource = new VectorSource()
    userLocationSourceRef.current = userLocationSource

    // Create animated halo using postrender
    let animationFrameId: number | null = null
    let startTime = Date.now()

    const userLocationLayer = new VectorLayer({
      source: userLocationSource,
      style: () => {
        const elapsed = Date.now() - startTime
        const cycle = (elapsed % 2000) / 2000 // 2 second cycle
        const scale = 1 + cycle * 2 // Grow from 1 to 3
        const opacity = 0.5 * (1 - cycle) // Fade from 0.5 to 0
        const heading = userHeadingRef.current

        const styles = [
          // Halo (outer pulsing ring)
          new Style({
            image: new CircleStyle({
              radius: 12 * scale,
              fill: new Fill({ color: `rgba(34, 197, 94, ${opacity})` }),
              stroke: new Stroke({
                color: `rgba(34, 197, 94, ${opacity})`,
                width: 2
              }),
            }),
          }),
          // Center dot
          new Style({
            image: new CircleStyle({
              radius: 8,
              fill: new Fill({ color: '#22c55e' }),
              stroke: new Stroke({ color: 'white', width: 3 }),
            }),
          }),
        ]

        // Add direction cone if heading is available
        if (heading !== null) {
          styles.unshift(
            // Direction cone (field of view indicator)
            new Style({
              image: new RegularShape({
                points: 3,
                radius: 30,
                rotation: (heading * Math.PI) / 180,
                angle: 0,
                displacement: [0, -20],
                fill: new Fill({ color: 'rgba(34, 197, 94, 0.3)' }),
                stroke: new Stroke({ color: 'rgba(34, 197, 94, 0.6)', width: 1 }),
              }),
            })
          )
        }

        return styles
      },
    })

    // Animate the halo
    userLocationLayer.on('postrender', () => {
      if (userLocationSource.getFeatures().length > 0) {
        mapInstanceRef.current?.render()
      }
    })

    const tileLayer = new TileLayer({
      source: new OSM(),
    })
    tileLayerRef.current = tileLayer

    // Roads layer for satellite view
    const labelsLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
      }),
      visible: false,
    })
    labelsLayerRef.current = labelsLayer

    // Places layer for satellite view (cities, towns, boundaries)
    const placesLayer = new TileLayer({
      source: new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
      }),
      visible: false,
    })
    placesLayerRef.current = placesLayer

    const map = new Map({
      target: mapRef.current,
      layers: [
        tileLayer,
        labelsLayer,
        placesLayer,
        vectorLayer,
        userLocationLayer,
      ],
      view: new View({
        center: fromLonLat([24.74376, 45.82746]),
        zoom: 7,
      }),
    })

    // Handle click on features
    map.on('click', (event) => {
      // Get the cluster feature
      const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f)

      if (feature) {
        // It's a cluster feature, it contains original features
        const features = feature.get('features') as Feature[]

        if (features && features.length > 1) {
          // Cluster clicked - zoom to extent
          const extent = createEmpty()
          features.forEach((f) => extend(extent, f.getGeometry()!.getExtent()))

          // Add some padding
          const view = map.getView()
          const resolution = view.getResolutionForExtent(extent)
          const zoom = view.getZoomForResolution(resolution)

          if (view.getAnimating()) return

          view.animate({
            center: [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2],
            zoom: zoom ? Math.min(zoom, 19) - 0.5 : view.getZoom()! + 1, // Don't zoom in too deep
            duration: 500
          })
          return
        }

        if (features && features.length === 1) {
          // Single pin clicked
          const pinData = features[0].get('pinData') as PinData
          if (pinData) {
            onPinClick(pinData)
            if (isAddModeRef.current) {
              setIsAddModeRef.current(false)
            }
          }
        }
      } else if (isAddModeRef.current) {
        // Clicked on empty space
        const coords = toLonLat(event.coordinate)
        onMapClick(coords[1], coords[0])
        setIsAddModeRef.current(false)
      }
    })

    // Change cursor on hover
    map.on('pointermove', (event) => {
      if (map.getView().getInteracting() || map.getView().getAnimating()) return

      const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f)
      const targetElement = map.getTargetElement()
      if (targetElement) {
        targetElement.style.cursor = feature ? 'pointer' : (isAddModeRef.current ? 'crosshair' : '')
      }
    })

    mapInstanceRef.current = map

    setTimeout(() => {
      map.updateSize()
    }, 0)

    const resizeObserver = new ResizeObserver(() => {
      map.updateSize()
    })
    resizeObserver.observe(mapRef.current)

    return () => {
      resizeObserver.disconnect()
      map.setTarget(undefined)
      mapInstanceRef.current = null
      clusterSourceRef.current = null
      userLocationSourceRef.current = null
    }
  }, [])

  // Update cursor and refs when add mode changes
  useEffect(() => {
    isAddModeRef.current = isAddMode
    setIsAddModeRef.current = setIsAddMode
    const targetElement = mapInstanceRef.current?.getTargetElement()
    if (targetElement) {
      targetElement.style.cursor = isAddMode ? 'crosshair' : ''
    }
  }, [isAddMode, setIsAddMode])

  // Update pins on map
  useEffect(() => {
    if (!vectorSourceRef.current) return
    if (!clusterSourceRef.current) return // Safety check

    vectorSourceRef.current.clear()

    pins.forEach((pin) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([pin.lng, pin.lat])),
        pinData: pin,
      })
      vectorSourceRef.current!.addFeature(feature)
    })

    // Force redraw to update selection styles in cluster
    clusterSourceRef.current.refresh()
  }, [pins, selectedPinId])

  // Update user location on map
  useEffect(() => {
    if (!userLocationSourceRef.current || !mapInstanceRef.current) return

    userLocationSourceRef.current.clear()

    if (userLocation) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([userLocation.lng, userLocation.lat])),
        isUserLocation: true,
      })
      userLocationSourceRef.current.addFeature(feature)
    }
  }, [userLocation])

  // Update heading ref and trigger re-render
  useEffect(() => {
    userHeadingRef.current = userHeading ?? null
    // Force re-render of user location layer
    if (userLocationSourceRef.current && mapInstanceRef.current) {
      userLocationSourceRef.current.changed()
    }
  }, [userHeading])

  // Zoom to user location only when requested
  useEffect(() => {
    if (!shouldZoomToUser || !userLocation || !mapInstanceRef.current) return

    const view = mapInstanceRef.current.getView()
    view.animate({
      center: fromLonLat([userLocation.lng, userLocation.lat]),
      zoom: 14,
      duration: 800,
    })

    onZoomComplete?.()
  }, [shouldZoomToUser, userLocation, onZoomComplete])

  // Switch between OSM and satellite view
  useEffect(() => {
    if (!tileLayerRef.current || !labelsLayerRef.current || !placesLayerRef.current) return

    if (isSatelliteView) {
      tileLayerRef.current.setSource(
        new XYZ({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maxZoom: 19,
        })
      )
      labelsLayerRef.current.setVisible(true)
      placesLayerRef.current.setVisible(true)
    } else {
      tileLayerRef.current.setSource(new OSM())
      labelsLayerRef.current.setVisible(false)
      placesLayerRef.current.setVisible(false)
    }
  }, [isSatelliteView])

  return (
    <div className="absolute inset-0">
      <div ref={mapRef} className="absolute inset-0" />

      {/* Halo effect for user location (CSS animation) */}
      {userLocation && (
        <style jsx global>{`
          @keyframes pulse-halo {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.6;
            }
            100% {
              transform: translate(-50%, -50%) scale(3);
              opacity: 0;
            }
          }
        `}</style>
      )}

      {/* Instructions overlay when in add mode */}
      {isAddMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
          Click anywhere on the map to add a pin
          <button
            onClick={() => setIsAddMode(false)}
            className="ml-3 text-red-300 hover:text-red-100"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
