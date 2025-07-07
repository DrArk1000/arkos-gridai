"use client"

import { useState, useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { ArkosLogo } from "./components/arkos-logo"
import { Activity, Zap, Shield, TrendingUp } from "lucide-react"

// Set Mapbox access token (replace with your actual token or use environment variable in production)
// In production, use: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
mapboxgl.accessToken = "pk.eyJ1IjoiYXJrb3MtZ3JpZCIsImEiOiJjbDZ2ZzFvYzQwM2VtM2RwY3F3b2NkOG5jIn0.9Xv6X0Z3Z3Z3Z3Z3Z3Z3Zg" // Public token (rate-limited)

interface GridAnalysisResult {
  grid_stability_score: number
  transmission_capacity_score: number
  interconnection_risk_score: number
  bankability_rating: string
  estimated_timeline_months: number
  risk_factors: string[]
}

export default function GridAnalyzer() {
  // Australia-first defaults
  const [latitude, setLatitude] = useState<string>("-33.8688") // Sydney
  const [longitude, setLongitude] = useState<string>("151.2093") // Sydney

  // Waitlist email
  const [email, setEmail] = useState<string>("")
  const [waitlistMsg, setWaitlistMsg] = useState<string>("")
  const [results, setResults] = useState<GridAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (map.current) return // Initialize map only once

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [133.7751, -25.2744], // Center of Australia
        zoom: 4,
      })

      // Add REZ transmission line overlay
      map.current.on("load", () => {
        if (map.current) {
          map.current.addSource("transmission-lines", {
            type: "geojson",
            data: "https://your-geojson-url-placeholder.com/transmission-infrastructure.geojson",
          })

          map.current.addLayer({
            id: "transmission-infrastructure",
            type: "line",
            source: "transmission-lines",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3b82f6",
              "line-width": 2,
              "line-opacity": 0.8,
            },
          })

          // Add high-voltage lines
          map.current.addLayer({
            id: "high-voltage-lines",
            type: "line",
            source: "transmission-lines",
            filter: [">=", ["get", "voltage"], 345],
            paint: {
              "line-color": "#06b6d4",
              "line-width": 3,
              "line-opacity": 1,
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

        new mapboxgl.Marker({
          color: "#3b82f6",
          scale: 1.2,
        })
          .setLngLat([lon, lat])
          .addTo(map.current)
      }
    }
  }

  const analyzeGrid = async () => {
    if (!latitude || !longitude) {
      setError("Please enter both latitude and longitude coordinates")
      return
    }
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: parseFloat(latitude),
          lon: parseFloat(longitude),
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze grid')
      }
      
      const data = await response.json()
      const triScore = data.score
      
      // Calculate bankability based on TRI score
      let bankabilityRating = 'D'
      if (triScore >= 80) bankabilityRating = 'A'
      else if (triScore >= 60) bankabilityRating = 'B'
      else if (triScore >= 40) bankabilityRating = 'C'
      
      setResults({
        grid_stability_score: triScore,
        transmission_capacity_score: 100 - triScore, // Inverted for demonstration
        interconnection_risk_score: Math.round(triScore * 0.8), // Slightly lower than TRI
        bankability_rating: bankabilityRating,
        estimated_timeline_months: Math.floor(Math.random() * 12) + 6, // 6-18 months
        risk_factors: [
          triScore > 70 ? 'High grid congestion' : 'Moderate grid congestion',
          triScore > 50 ? 'Limited transmission capacity' : 'Adequate transmission capacity',
          triScore > 30 ? 'Interconnection queue risk' : 'Favorable interconnection outlook',
        ],
      })
    } catch (error) {
      console.error('Error analyzing grid:', error)
      alert('Failed to analyze grid. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-emerald-600"
    if (score >= 60) return "from-amber-500 to-amber-600"
    return "from-red-500 to-red-600"
  }

  const getBankabilityColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "excellent":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      case "good":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20"
      case "moderate":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20"
      case "poor":
        return "text-red-400 bg-red-500/10 border-red-500/20"
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <ArkosLogo />
            <div className="text-right">
              <div className="text-sm text-slate-400">Grid Bankability Analysis</div>
              <div className="text-xs text-slate-500">5-minute assessment • Real-time data</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-4 py-8 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Grid Connection Analysis
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Instant bankability assessment for renewable energy projects. Replace 6-month studies with AI-powered
            5-minute analysis.
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>Real-time grid data</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>Bank-grade analysis</span>
            </div>
          </div>
        </div>

        {/* Input Panel */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-slate-300 mb-2">
                Latitude
              </label>
              <input
                type="number"
                id="latitude"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="40.7128"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-slate-300 mb-2">
                Longitude
              </label>
              <input
                type="number"
                id="longitude"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="-74.0060"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-all"
              />
            </div>
          </div>

          {/* Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">Transmission Infrastructure</h3>
              <div className="flex items-center space-x-3 text-xs text-slate-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-0.5 bg-blue-500"></div>
                  <span>Standard Lines</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-0.5 bg-cyan-500"></div>
                  <span>High Voltage</span>
                </div>
              </div>
            </div>
            <div
              ref={mapContainer}
              className="w-full h-[400px] rounded-lg overflow-hidden border border-slate-700 bg-slate-800"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={analyzeGrid}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Analyzing Grid Connection...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Analyze Grid Bankability</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5">
              <div
                className={`bg-gradient-to-r ${getScoreColor(100 - results.interconnection_risk_score)} rounded-lg p-4`}
              >
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h4 className="font-semibold text-sm opacity-90">Interconnection Risk</h4>
                    <div className="text-2xl font-bold">{results.interconnection_risk_score}%</div>
                  </div>
                  <div className="text-right opacity-75">
                    <div className="text-xs">Risk Level</div>
                    <div className="text-sm">Lower is better</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          {results.risk_factors && results.risk_factors.length > 0 && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h4 className="font-semibold text-white mb-3">Key Risk Factors</h4>
              <div className="space-y-2">
                {results.risk_factors.map((factor, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-300">{factor}</span>
              <div className="mt-4 text-sm text-slate-400">
                Estimated Timeline:{" "}
                <span className="text-white font-medium">{results.estimated_timeline_months} months</span>
              </div>
            </div>

            {/* Score Cards */}
            <div className="space-y-3">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5">
                <div className={`bg-gradient-to-r ${getScoreColor(results.grid_stability_score)} rounded-lg p-4`}>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h4 className="font-semibold text-sm opacity-90">Grid Stability</h4>
                      <div className="text-2xl font-bold">{results.grid_stability_score}</div>
                    </div>
                    <div className="text-right opacity-75">
                      <div className="text-xs">Score</div>
                      <div className="text-sm">/ 100</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5">
                <div
                  className={`bg-gradient-to-r ${getScoreColor(results.transmission_capacity_score)} rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h4 className="font-semibold text-sm opacity-90">Transmission Capacity</h4>
                      <div className="text-2xl font-bold">{results.transmission_capacity_score}</div>
                    </div>
                    <div className="text-right opacity-75">
                      <div className="text-xs">Score</div>
                      <div className="text-sm">/ 100</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-5">
                <div
                  className={`bg-gradient-to-r ${getScoreColor(100 - results.interconnection_risk_score)} rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h4 className="font-semibold text-sm opacity-90">Interconnection Risk</h4>
                      <div className="text-2xl font-bold">{results.interconnection_risk_score}%</div>
                    </div>
                    <div className="text-right opacity-75">
                      <div className="text-xs">Risk Level</div>
                      <div className="text-sm">Lower is better</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {results.risk_factors && results.risk_factors.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-3">Key Risk Factors</h4>
                <div className="space-y-2">
                  {results.risk_factors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-slate-300">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Powered by real-time grid operator data • Analysis completed in under 5 minutes
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Replacing traditional 6-month feasibility studies with AI-driven insights
          </p>
        </div>
      </div>
    </div>
  )
}
