'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import dynamic from 'next/dynamic'

const MapPage = dynamic(() => import('@/components/map'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
      <p className="text-gray-600">Loading map...</p>
    </div>
  )
})

interface GeoLocation {
  ip: string,
  hostname?: string,
  city?: string
  region?: string
  country?: string
  loc?: string
  org?: string
  postal?: string
  timezone?: string, 
  readme?: string
}

interface HistoryItem {
  ip: string
  timestamp: number
  selected?: boolean
}

export default function Home() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [geoData, setGeoData] = useState<GeoLocation | null>(null)
  const [searchIp, setSearchIp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login')
      return
    }

    if (session && !geoData) {
      fetchGeoLocation()
    }

  }, [session, isPending])

  useEffect(() => {
    const storedHistory = localStorage.getItem('ipHistory')
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory))
    }
  }, [])

  const fetchGeoLocation = async (ip?: string) => {
    setIsLoading(true)
    setError('')
    
    try {
      const url = ip ? `/api/geo?ip=${encodeURIComponent(ip)}` : '/api/geo'
          
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()

      setGeoData(data)

      if (ip) {
        setHistory(prevHistory => {

          if (prevHistory.find(item => item.ip === ip)) {
            return prevHistory
          }
          const newHistory = [...prevHistory, { ip, timestamp: Date.now(), selected: false }]
          localStorage.setItem('ipHistory', JSON.stringify(newHistory))
          return newHistory
        })
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch geolocation')
      setGeoData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const validateIp = (ip: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.')
      return parts.every(part => parseInt(part) <= 255)
    }
    
    return ipv6Regex.test(ip)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchIp.trim()) {
      setError('Please enter an IP address')
      return
    }

    if (!validateIp(searchIp)) {
      setError('Please enter a valid IP address')
      return
    }

    fetchGeoLocation(searchIp)
  }

  const handleClear = () => {
    setSearchIp('')
    setError('')
    fetchGeoLocation()
  }

  const handleHistoryClick = (ip: string) => {
    setSearchIp(ip)
    fetchGeoLocation(ip)
  }

  const toggleHistorySelection = (index: number) => {
    const newHistory = [...history]
    newHistory[index].selected = !newHistory[index].selected
    setHistory(newHistory)
  }

  const deleteSelected = () => {
    const newHistory = history.filter(item => !item.selected)
    setHistory(newHistory)
    localStorage.setItem('ipHistory', JSON.stringify(newHistory))
  }

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push('/login')
          }
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IP Geolocation Tracker</h1>
            <p className="text-gray-600 mt-1">Welcome, {session.user.name || session.user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Search IP Address</h2>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchIp}
                    onChange={(e) => {
                      setSearchIp(e.target.value)
                      setError('')
                    }}
                    placeholder="Enter IP address (e.g., 8.8.8.8)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
                  >
                    {isLoading ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {error && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
              </form>
            </div>

            {geoData && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Geolocation Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">IP Address</p>
                    <p className="text-lg font-semibold text-gray-900">{geoData.ip}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">City</p>
                    <p className="text-lg font-semibold text-gray-900">{geoData.city || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Region</p>
                    <p className="text-lg font-semibold text-gray-900">{geoData.region || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Country</p>
                    <p className="text-lg font-semibold text-gray-900">{geoData.country || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Location</p>
                    <p className="text-lg font-semibold text-gray-900">{geoData.loc || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Timezone</p>
                    <p className="text-lg font-semibold text-gray-900">{geoData.timezone || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Organization</p>
                    <p className="text-lg font-semibold text-gray-900">{geoData.org || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Search History</h2>
                {history.some(item => item.selected) && (
                  <button
                    onClick={deleteSelected}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                  >
                    Delete Selected
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No search history yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {history.slice().reverse().map((item, index) => {
                    const actualIndex = history.length - 1 - index
                    return (
                      <div
                        key={actualIndex}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={item.selected || false}
                          onChange={() => toggleHistorySelection(actualIndex)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <button
                          onClick={() => handleHistoryClick(item.ip)}
                          className="flex-1 text-left"
                        >
                          <p className="font-medium text-gray-900">{item.ip}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
                {geoData?.loc && (
                <MapPage 
                  lat={parseFloat(geoData.loc.split(',')[0]) || 0} 
                  lng={parseFloat(geoData.loc.split(',')[1]) || 0} />
                )}
            </div>

          </div>
        </div>

      </div>
      
    </div>
  )
}
