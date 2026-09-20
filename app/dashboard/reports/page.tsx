'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'
import Header from '@/components/Header'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface ReportData {
  totalAmount: number
  totalCustomers: number
  averageAmount: number
  serviceBreakdown: { service: string; count: number }[]
  staffBreakdown: { staff: string; count: number; amount: number }[]
  paymentTypeBreakdown: { type: string; count: number; amount: number }[]
  dailyData: { date: string; amount: number; customers: number }[]
}

const PRESET_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'lastWeek', label: 'Last Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
] as const

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [activePreset, setActivePreset] = useState<string>('today')
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
        return
      } catch {}
    }

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
          setUser(data.user)
        }
      })
      .catch(() => {})
  }, [])

  const fetchReportData = useCallback(async () => {
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
  }, [timeFilter, serviceFilter, dateRange])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

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

  const handlePresetClick = (preset: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth') => {
    setActivePreset(preset)
    const today = new Date()
    
    switch (preset) {
      case 'today':
        setDateRange({
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        })
        setTimeFilter('daily')
        break
      case 'yesterday': {
        const yesterday = subDays(today, 1)
        setDateRange({
          start: format(yesterday, 'yyyy-MM-dd'),
          end: format(yesterday, 'yyyy-MM-dd')
        })
        setTimeFilter('daily')
        break
      }
      case 'thisWeek':
        setDateRange({
          start: format(startOfWeek(today), 'yyyy-MM-dd'),
          end: format(endOfWeek(today), 'yyyy-MM-dd')
        })
        setTimeFilter('weekly')
        break
      case 'lastWeek': {
        const lastWeekStart = startOfWeek(subWeeks(today, 1))
        const lastWeekEnd = endOfWeek(subWeeks(today, 1))
        setDateRange({
          start: format(lastWeekStart, 'yyyy-MM-dd'),
          end: format(lastWeekEnd, 'yyyy-MM-dd')
        })
        setTimeFilter('weekly')
        break
      }
      case 'thisMonth':
        setDateRange({
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        })
        setTimeFilter('monthly')
        break
      case 'lastMonth': {
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
  }

  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    setActivePreset('custom')
    setDateRange(prev => ({ ...prev, [type]: val }))
  }

  const totalServicesCount = reportData?.serviceBreakdown?.reduce((acc, s) => acc + s.count, 0) || 1
  const maxStaffAmount = reportData?.staffBreakdown?.[0]?.amount || 1
  const totalPaymentSum = reportData?.paymentTypeBreakdown?.reduce((acc, p) => acc + p.amount, 0) || 1

  return (
    <div className="min-h-screen bg-gray-50/70 pb-16">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📊</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Revenue & Salon Analytics
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Real-time sales performance, customer trends, and staff productivity
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="btn-secondary flex items-center space-x-2 text-xs font-semibold py-2 px-3.5"
              title="Print or export as PDF"
            >
              <span>🖨️</span>
              <span>Print Report</span>
            </button>
            <button
              onClick={fetchReportData}
              className="btn-secondary flex items-center space-x-1.5 text-xs font-semibold py-2 px-3.5"
              title="Refresh numbers"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* CONTROLS CARD */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs mb-8 space-y-4">
          {/* Quick Presets Segmented Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Quick Time Presets:
            </span>
            <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100/80 rounded-xl border border-gray-200/60">
              {PRESET_OPTIONS.map(preset => {
                const isActive = activePreset === preset.id
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-primary-700 text-white shadow-sm'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Period Mode */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Grouping Interval
              </label>
              <select
                value={timeFilter}
                onChange={(e) => {
                  setActivePreset('custom')
                  setTimeFilter(e.target.value as 'daily' | 'weekly' | 'monthly')
                }}
                className="input-field text-sm"
              >
                <option value="daily">Daily Interval</option>
                <option value="weekly">Weekly Interval</option>
                <option value="monthly">Monthly Interval</option>
              </select>
            </div>

            {/* Service Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Service Filter
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">All Services</option>
                <option value="Eyebrow">Eyebrow</option>
                <option value="Hair Cut">Hair Cut</option>
                <option value="Hair Color">Hair Color</option>
                <option value="Facial">Facial</option>
                <option value="Keratin">Keratin Treatment</option>
                <option value="Manicure">Manicure</option>
                <option value="Pedicure">Pedicure</option>
                <option value="Beard Trim">Beard Trim</option>
                <option value="Waxing">Waxing</option>
                <option value="Makeup">Makeup</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                className="input-field text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>
        </div>

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary-600 border-t-transparent"></div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Computing analytics...
            </p>
          </div>
        )}

        {!loading && reportData && (
          <>
            {/* EXECUTIVE SUMMARY KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Total Revenue */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shadow-xs">
                    ₹
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  ₹{reportData.totalAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 font-medium flex items-center space-x-1">
                  <span className="text-emerald-700 font-semibold">●</span>
                  <span>Gross collections for selected period</span>
                </p>
              </div>

              {/* Total Customers */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Total Customers
                  </span>
                  <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg shadow-xs">
                    👥
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {reportData.totalCustomers.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 font-medium flex items-center space-x-1">
                  <span className="text-blue-700 font-semibold">●</span>
                  <span>Client visits completed</span>
                </p>
              </div>

              {/* Average Ticket Size */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Average Bill Size
                  </span>
                  <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center text-lg shadow-xs">
                    💎
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  ₹{Math.round(reportData.averageAmount).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 font-medium flex items-center space-x-1">
                  <span className="text-purple-700 font-semibold">●</span>
                  <span>Avg. revenue per customer visit</span>
                </p>
              </div>

              {/* Period Overview */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Selected Window
                  </span>
                  <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg shadow-xs">
                    📅
                  </span>
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-900 leading-snug truncate">
                  {getDateRangeLabel()}
                </div>
                <p className="text-xs text-gray-500 mt-1.5 font-medium uppercase tracking-wider">
                  Mode: <span className="font-semibold text-gray-700">{timeFilter}</span>
                </p>
              </div>
            </div>

            {/* BREAKDOWN SECTIONS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Service Breakdown */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">✂️</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Services Rendered
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                    {reportData.serviceBreakdown.length} Services
                  </span>
                </div>

                {reportData.serviceBreakdown.length > 0 ? (
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {reportData.serviceBreakdown.map((item, index) => {
                      const sharePercent = Math.round((item.count / totalServicesCount) * 100)
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-medium">
                            <span className="text-gray-900 font-semibold">{item.service}</span>
                            <span className="text-gray-600 font-mono">
                              {item.count} {item.count === 1 ? 'client' : 'clients'} ({sharePercent}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary-500 to-amber-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(sharePercent, 4)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No service records in selected period
                  </div>
                )}
              </div>

              {/* Staff Breakdown */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👥</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Staff Revenue Contribution
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                    {reportData.staffBreakdown.length} Staff Members
                  </span>
                </div>

                {reportData.staffBreakdown.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {reportData.staffBreakdown.map((staffItem, index) => {
                      const percentOfMax = Math.round((staffItem.amount / maxStaffAmount) * 100)
                      return (
                        <div
                          key={index}
                          className="p-3 bg-gray-50/70 border border-gray-200/60 rounded-xl flex items-center justify-between space-x-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs">
                              {staffItem.staff.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-900">{staffItem.staff}</div>
                              <div className="text-[11px] text-gray-500">
                                {staffItem.count} {staffItem.count === 1 ? 'service' : 'services'} handled
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-extrabold text-gray-900">
                              ₹{staffItem.amount.toLocaleString('en-IN')}
                            </div>
                            <div className="w-20 bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1 ml-auto">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${Math.max(percentOfMax, 5)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No staff records in selected period
                  </div>
                )}
              </div>
            </div>

            {/* PAYMENT METHODS & DAILY TIMELINE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods Breakdown */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">💳</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Payment Distribution
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">
                    Total: ₹{totalPaymentSum.toLocaleString('en-IN')}
                  </span>
                </div>

                {reportData.paymentTypeBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {/* Visual 3-part Bar */}
                    <div className="w-full h-3 bg-gray-100 rounded-full flex overflow-hidden">
                      {reportData.paymentTypeBreakdown.map((pm, i) => {
                        const pct = (pm.amount / totalPaymentSum) * 100
                        const colors = ['bg-emerald-500', 'bg-purple-500', 'bg-blue-500']
                        return (
                          <div
                            key={i}
                            className={`${colors[i % colors.length]} h-full transition-all`}
                            style={{ width: `${pct}%` }}
                            title={`${pm.type}: ${Math.round(pct)}%`}
                          />
                        )
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      {reportData.paymentTypeBreakdown.map((payment, index) => {
                        const icons: Record<string, string> = { CASH: '💵', UPI: '📱', CARD: '💳' }
                        const pct = Math.round((payment.amount / totalPaymentSum) * 100)
                        return (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-center"
                          >
                            <span className="text-xl block mb-1">
                              {icons[payment.type] || '💰'}
                            </span>
                            <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                              {payment.type}
                            </div>
                            <div className="text-sm font-extrabold text-gray-900 mt-1">
                              ₹{payment.amount.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                              {payment.count} txns ({pct}%)
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No payment data recorded
                  </div>
                )}
              </div>

              {/* Daily Sales Trend */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📈</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Daily Sales Trend
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">
                    Last {Math.min(reportData.dailyData.length, 7)} Recorded Days
                  </span>
                </div>

                {reportData.dailyData.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    <div className="grid grid-cols-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider pb-1 px-3">
                      <span>Date</span>
                      <span className="text-center">Customers</span>
                      <span className="text-right">Total Sales</span>
                    </div>
                    {reportData.dailyData.slice(-7).reverse().map((day, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-3 items-center px-3 py-2.5 rounded-lg text-xs bg-gray-50/70 hover:bg-gray-100 transition-colors border border-gray-100"
                      >
                        <span className="font-semibold text-gray-800">
                          {format(new Date(day.date), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-center font-mono text-gray-600">
                          {day.customers}
                        </span>
                        <span className="text-right font-bold text-emerald-700 font-mono">
                          ₹{day.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    No daily trends available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
