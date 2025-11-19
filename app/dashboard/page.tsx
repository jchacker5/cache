'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, BarChart3, ShoppingCart, Search, Loader2 } from 'lucide-react'
import { DataService } from '@/lib/data-service'
import { useAuth } from '@clerk/nextjs'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { userId } = useAuth()

  useEffect(() => {
    if (userId) {
      loadDashboardData()
    }
  }, [userId])

  const loadDashboardData = async () => {
    try {
      const data = await DataService.getDashboardMetrics(userId!)
      setMetrics(data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Use loaded data or fallback to defaults
  const cash = metrics?.cash ?? 1280000
  const burn = metrics?.burn ?? 22479.90
  const runway = metrics?.runway ?? 4.8
  const todaySpending = metrics?.todaySpending ?? 865.00
  const last28Days = metrics?.last28Days ?? 23842.00
  const last365Days = metrics?.last365Days ?? 249295.00

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile-first layout */}
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Status bar simulation for mobile */}
        <div className="h-6 bg-black text-white text-[10px] flex items-center justify-between px-4">
          <span>18:33</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 border border-white rounded-sm">
              <div className="w-3 h-1.5 bg-white rounded-sm m-0.5"></div>
            </div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Main content */}
        <div className="px-4 py-6 space-y-6">
          {/* Top three metric cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-3">
                <p className="text-[10px] text-gray-500 mb-1">Cash</p>
                <p className="text-sm font-semibold">{formatCurrency(cash)}</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-3">
                <p className="text-[10px] text-gray-500 mb-1">Burn</p>
                <p className="text-sm font-semibold">{formatCurrency(burn)}</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-3">
                <p className="text-[10px] text-gray-500 mb-1">Runway</p>
                <p className="text-sm font-semibold">{runway} yrs</p>
              </CardContent>
            </Card>
          </div>

          {/* Three larger spending cards */}
          <div className="space-y-3">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-2">Today</p>
                <p className="text-2xl font-bold">{formatCurrency(todaySpending)}</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-2">Last 28 Days</p>
                <p className="text-2xl font-bold">{formatCurrency(last28Days)}</p>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-2">Last 365 Days</p>
                <p className="text-2xl font-bold">{formatCurrency(last365Days)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 border border-gray-200">
              <FileText className="h-5 w-5 text-gray-600" />
              <div className="text-center">
                <p className="text-xs font-medium">Income Statement</p>
                <p className="text-[10px] text-gray-500">Generate for period</p>
              </div>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 border border-gray-200">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              <div className="text-center">
                <p className="text-xs font-medium">Cash Flow</p>
                <p className="text-[10px] text-gray-500">Show last quarter</p>
              </div>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2 border border-gray-200">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <div className="text-center">
                <p className="text-xs font-medium">Top Exp</p>
                <p className="text-[10px] text-gray-500">View this</p>
              </div>
            </Button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ask something..."
              className="pl-10 h-12 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        {/* Bottom navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200">
          <div className="h-1 w-12 bg-gray-300 rounded-full mx-auto mt-2"></div>
        </div>
      </div>
    </div>
  )
}
