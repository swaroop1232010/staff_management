'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Customer {
  id: string
  name: string
  contact: string
  email?: string
  photo?: string
  services: string
  serviceTakenBy?: string
  amount: number
  discount: number
  discountType?: string
  paymentType: 'CASH' | 'UPI' | 'CARD'
  visitDate: string
  notes?: string
}

interface Staff {
  id: string;
  name: string;
  position: string;
  isActive: boolean;
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState('')
  
  // New filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentType: '',
    service: '',
    showFilters: false
  })
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchCustomers()
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      if (response.ok) {
        const data = await response.json()
        setStaff(data.filter((s: Staff) => s.isActive))
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      } else {
        toast.error('Failed to fetch customers')
      }
    } catch (error) {
      toast.error('An error occurred while fetching customers')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    try {
      const csvData = filteredCustomers.map((customer) => {
        const discountAmount = customer.amount * customer.discount / 100
        const finalAmount = customer.amount - discountAmount
        return {
          Name: customer.name,
          Contact: customer.contact,
          Email: customer.email || '',
          Services: JSON.parse(customer.services).join('; '),
          ServiceTakenBy: customer.serviceTakenBy || '',
          Amount: customer.amount,
          Discount: customer.discount,
          FinalAmount: finalAmount,
          PaymentType: customer.paymentType,
          VisitDate: new Date(customer.visitDate).toLocaleDateString(),
          Notes: customer.notes || ''
        }
      })

      const csv = convertToCSV(csvData)
      const filename = selectedStaff 
        ? `swasthik-customers-${selectedStaff.replace(/\s+/g, '-').toLowerCase()}.csv`
        : 'swasthik-customers.csv'
      downloadCSV(csv, filename)
      toast.success(`Exported ${csvData.length} customer(s) successfully!`)
    } catch (error) {
      toast.error('Error exporting data')
    }
  }

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(customer => customer.id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select customers to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedCustomers.length} customer(s)?`)) {
      return
    }

    setBulkDeleting(true)
    let successCount = 0
    let failedCount = 0

    try {
      for (const customerId of selectedCustomers) {
        try {
          const response = await fetch(`/api/customers/${customerId}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            successCount++
          } else {
            failedCount++
          }
        } catch (error) {
          failedCount++
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} customer(s)`)
        fetchCustomers()
        setSelectedCustomers([])
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} customer(s)`)
      }
    } catch (error) {
      toast.error('Error during bulk delete')
    } finally {
      setBulkDeleting(false)
    }
  }

  // Get unique services for filter dropdown
  const getUniqueServices = () => {
    const services = new Set<string>()
    customers.forEach(customer => {
      try {
        const customerServices = JSON.parse(customer.services)
        customerServices.forEach((service: string) => services.add(service))
      } catch (error) {
        console.error('Error parsing services:', error)
      }
    })
    return Array.from(services).sort()
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStaff = !selectedStaff || customer.serviceTakenBy === selectedStaff
    
    // Date filtering
    const customerDate = new Date(customer.visitDate)
    const matchesStartDate = !filters.startDate || customerDate >= new Date(filters.startDate)
    const matchesEndDate = !filters.endDate || customerDate <= new Date(filters.endDate)
    
    // Payment type filtering
    const matchesPaymentType = !filters.paymentType || customer.paymentType === filters.paymentType
    
    // Service filtering
    let matchesService = true
    if (filters.service) {
      try {
        const customerServices = JSON.parse(customer.services)
        matchesService = customerServices.includes(filters.service)
      } catch (error) {
        matchesService = false
      }
    }
    
    return matchesSearch && matchesStaff && matchesStartDate && matchesEndDate && matchesPaymentType && matchesService
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStaff, filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentType: '',
      service: '',
      showFilters: false
    })
    setSearchTerm('')
    setSelectedStaff('')
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Customer Records</h2>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Total: {customers.length} customers
              {selectedCustomers.length > 0 && (
                <span className="ml-2 text-primary-600 font-medium">
                  ({selectedCustomers.length} selected)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {selectedCustomers.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="btn-secondary text-sm flex items-center space-x-1 bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                >
                  {bulkDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Selected</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={exportToCSV}
                className="btn-secondary text-sm flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Search and Basic Filters */}
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search customers by name, contact, or email..."
            className="input-field flex-1 min-w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="input-field min-w-48"
          >
            <option value="">All Staff</option>
            {staff.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name} - {member.position}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }))}
            className="btn-secondary flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>Filters</span>
          </button>
          <button
            onClick={clearFilters}
            className="btn-secondary text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        </div>

        {/* Advanced Filters */}
        {filters.showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select
                  value={filters.paymentType}
                  onChange={(e) => handleFilterChange('paymentType', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Payment Types</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select
                  value={filters.service}
                  onChange={(e) => handleFilterChange('service', e.target.value)}
                  className="input-field"
                >
                  <option value="">All Services</option>
                  {getUniqueServices().map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Select All Controls */}
        {filteredCustomers.length > 0 && (
          <div className="flex items-center space-x-2 ml-4 mb-4">
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              {selectedCustomers.length === filteredCustomers.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedCustomers.length > 0 && (
              <button
                onClick={() => setSelectedCustomers([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Selection
              </button>
            )}
          </div>
        )}

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              {searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
            </div>
            <div className="text-gray-400 text-sm mt-2">
              {!searchTerm && 'Add your first customer to get started.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Taken By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCustomers.map((customer) => {
                  const services = JSON.parse(customer.services)
                  const discountAmount = customer.amount * customer.discount / 100
                  const finalAmount = customer.amount - discountAmount
                  
                  return (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-gray-50 ${selectedCustomers.includes(customer.id) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {customer.photo ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={customer.photo}
                              alt={customer.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {customer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            {customer.email && (
                              <div className="text-sm text-gray-500">
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.contact}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {services.slice(0, 2).map((service: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
                            >
                              {service}
                            </span>
                          ))}
                          {services.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{services.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.serviceTakenBy || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₹{finalAmount.toFixed(2)}
                        </div>
                        {customer.discount > 0 && (
                          <div className="text-xs text-green-600">
                            -₹{discountAmount.toFixed(2)} discount ({customer.discount}%)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.paymentType === 'CASH' 
                            ? 'bg-green-100 text-green-800'
                            : customer.paymentType === 'UPI'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {customer.paymentType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(customer.visitDate), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredCustomers.length > 0 && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper functions
function convertToCSV(data: any[]) {
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n')
  return csvContent
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
