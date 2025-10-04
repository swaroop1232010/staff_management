'use client'

import { useState, useEffect } from 'react'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'

interface ReportData {
  totalAmount: number
  totalCustomers: number
  averageAmount: number
  serviceBreakdown: { service: string; count: number; amount: number }[]
  staffBreakdown: { staff: string; count: number; amount: number }[]
  paymentTypeBreakdown: { type: string; count: number; amount: number }[]
  dailyData: { date: string; amount: number; customers: number }[]
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    fetchReportData()
  }, [timeFilter, serviceFilter, dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reports?timeFilter=${timeFilter}&serviceFilter=${serviceFilter}&startDate=${dateRange.start}&endDate=${dateRange.end}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        console.error('Failed to fetch report data')
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRangeLabel = () => {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    
    if (timeFilter === 'daily') {
      return format(start, 'MMM dd, yyyy')
    } else if (timeFilter === 'weekly') {
      return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`
    } else {
      return `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`
    }
  }

  const setPresetRange = (preset: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    const today = new Date()
    
    switch (preset) {
      case 'today':
        setDateRange({
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        })
        setTimeFilter('daily')
        break
      case 'yesterday':
        const yesterday = subDays(today, 1)
        setDateRange({
          start: format(yesterday, 'yyyy-MM-dd'),
          end: format(yesterday, 'yyyy-MM-dd')
        })
        setTimeFilter('daily')
        break
      case 'thisWeek':
        setDateRange({
          start: format(startOfWeek(today), 'yyyy-MM-dd'),
          end: format(endOfWeek(today), 'yyyy-MM-dd')
        })
        setTimeFilter('weekly')
        break
      case 'lastWeek':
        const lastWeekStart = startOfWeek(subWeeks(today, 1))
        const lastWeekEnd = endOfWeek(subWeeks(today, 1))
        setDateRange({
          start: format(lastWeekStart, 'yyyy-MM-dd'),
          end: format(lastWeekEnd, 'yyyy-MM-dd')
        })
        setTimeFilter('weekly')
        break
      case 'thisMonth':
        setDateRange({
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        })
        setTimeFilter('monthly')
        break
      case 'lastMonth':
        const lastMonthStart = startOfMonth(subMonths(today, 1))
        const lastMonthEnd = endOfMonth(subMonths(today, 1))
        setDateRange({
          start: format(lastMonthStart, 'yyyy-MM-dd'),
          end: format(lastMonthEnd, 'yyyy-MM-dd')
        })
        setTimeFilter('monthly')
        break
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Revenue Reports</h1>
            <p className="mt-2 text-gray-600">Analyze your salon's performance and revenue</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Time Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Service Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Filter</label>
                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Services</option>
                  <option value="Hair Cut">Hair Cut</option>
                  <option value="Hair Color">Hair Color</option>
                  <option value="Facial">Facial</option>
                  <option value="Manicure">Manicure</option>
                  <option value="Beard Trim">Beard Trim</option>
                  <option value="Blow Dry">Blow Dry</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setPresetRange('today')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Today
              </button>
              <button
                onClick={() => setPresetRange('yesterday')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Yesterday
              </button>
              <button
                onClick={() => setPresetRange('thisWeek')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                This Week
              </button>
              <button
                onClick={() => setPresetRange('lastWeek')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Last Week
              </button>
              <button
                onClick={() => setPresetRange('thisMonth')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                This Month
              </button>
              <button
                onClick={() => setPresetRange('lastMonth')}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Last Month
              </button>
            </div>
          </div>

          {reportData && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                        <span className="text-green-600 font-semibold">₹</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-semibold text-gray-900">₹{reportData.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">👥</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Customers</p>
                      <p className="text-2xl font-semibold text-gray-900">{reportData.totalCustomers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">📊</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Average Amount</p>
                      <p className="text-2xl font-semibold text-gray-900">₹{reportData.averageAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                        <span className="text-orange-600 font-semibold">📅</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Period</p>
                      <p className="text-sm font-semibold text-gray-900">{getDateRangeLabel()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts and Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Service</h3>
                  <div className="space-y-3">
                    {reportData.serviceBreakdown.map((service, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{service.service}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">₹{service.amount.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-2">({service.count} customers)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Staff</h3>
                  <div className="space-y-3">
                    {reportData.staffBreakdown.map((staff, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{staff.staff}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">₹{staff.amount.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-2">({staff.count} customers)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Type Breakdown */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                  <div className="space-y-3">
                    {reportData.paymentTypeBreakdown.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{payment.type}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-2">({payment.count} transactions)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Trend */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trend</h3>
                  <div className="space-y-2">
                    {reportData.dailyData.slice(-7).map((day, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{format(new Date(day.date), 'MMM dd')}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">₹{day.amount.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 ml-2">({day.customers} customers)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
