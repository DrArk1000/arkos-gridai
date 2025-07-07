"use client"

import { useState, useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "your-mapbox-token-here"

interface AnalysisResult {
  transmission_score: number
  environmental_score: number
  accessibility_score: number
}

export default function SiteAnalyzer() {
  const [latitude, setLatitude] = useState<string>("")
  const [longitude, setLongitude] = useState<string>("")
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (map.current) return // Initialize map only once

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: [-98.5795, 39.8283], // Center of US
        zoom: 4,
      })

      // Add REZ transmission line overlay
      map.current.on("load", () => {
        if (map.current) {
          map.current.addSource("rez-lines", {
            type: "geojson",
            data: "https://your-geojson-url-placeholder.com/rez-transmission-lines.geojson",
          })

          map.current.addLayer({
            id: "rez-transmission-lines",
            type: "line",
            source: "rez-lines",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#ff6b35",
              "line-width": 3,
              "line-opacity": 0.8,
            },
          })
        }
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  const updateMapCenter = () => {
    if (map.current && latitude && longitude) {
      const lat = Number.parseFloat(latitude)
      const lon = Number.parseFloat(longitude)

      if (!isNaN(lat) && !isNaN(lon)) {
        map.current.setCenter([lon, lat])
        map.current.setZoom(12)

        // Add or update marker
        const existingMarker = document.querySelector(".mapboxgl-marker")
        if (existingMarker) {
          existingMarker.remove()
        }

        new mapboxgl.Marker({ color: "#ef4444" }).setLngLat([lon, lat]).addTo(map.current)
      }
    }
  }

  const analyzeSite = async () => {
    if (!latitude || !longitude) {
      setError("Please enter both latitude and longitude")
      return
    }

    const lat = Number.parseFloat(latitude)
    const lon = Number.parseFloat(longitude)

    if (isNaN(lat) || isNaN(lon)) {
      setError("Please enter valid coordinates")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lat, lon }),
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()
      setResults(data)
      updateMapCenter()
    } catch (err) {
      setError("Failed to analyze site. Please try again.")
      console.error("Analysis error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500 dark:bg-green-600"
    if (score >= 60) return "bg-yellow-500 dark:bg-yellow-600"
    return "bg-red-500 dark:bg-red-600"
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return "text-green-700 dark:text-green-300"
    if (score >= 60) return "text-yellow-700 dark:text-yellow-300"
    return "text-red-700 dark:text-red-300"
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-[480px] mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Site Analyzer</h1>

          {/* Input Fields */}
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Latitude
              </label>
              <input
                type="number"
                id="latitude"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 40.7128"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Longitude
              </label>
              <input
                type="number"
                id="longitude"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -74.0060"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Map */}
          <div className="mb-6">
            <div
              ref={mapContainer}
              className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeSite}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze Site"}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className={`${getScoreColor(results.transmission_score)} rounded-lg p-4 text-white`}>
                <h3 className="font-semibold text-lg mb-2">Transmission Score</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{results.transmission_score}</span>
                  <span className="text-sm opacity-90">/ 100</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className={`${getScoreColor(results.environmental_score)} rounded-lg p-4 text-white`}>
                <h3 className="font-semibold text-lg mb-2">Environmental Score</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{results.environmental_score}</span>
                  <span className="text-sm opacity-90">/ 100</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <div className={`${getScoreColor(results.accessibility_score)} rounded-lg p-4 text-white`}>
                <h3 className="font-semibold text-lg mb-2">Accessibility Score</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{results.accessibility_score}</span>
                  <span className="text-sm opacity-90">/ 100</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
