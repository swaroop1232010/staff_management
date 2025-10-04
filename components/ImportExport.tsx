'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'

export default function ImportExport() {
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 })

  const exportToCSV = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const customers = await response.json()
        
        // Convert to CSV format
        const csvData = customers.map((customer: any) => {
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
        downloadCSV(csv, 'swasthik-customers.csv')
        toast.success('Data exported successfully!')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      toast.error('Error exporting data')
    } finally {
      setExporting(false)
    }
  }

  const exportToExcel = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const customers = await response.json()
        
        // Convert to Excel format
        const excelData = customers.map((customer: any) => {
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

        const ws = XLSX.utils.json_to_sheet(excelData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Customers')
        XLSX.writeFile(wb, 'swasthik-customers.xlsx')
        toast.success('Data exported successfully!')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      toast.error('Error exporting data')
    } finally {
      setExporting(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setImporting(true)
    setImportStats({ success: 0, failed: 0, total: 0 })
    
    try {
      const data = await readFile(file)
      const customers = parseImportData(data, file.name)
      
      setImportStats(prev => ({ ...prev, total: customers.length }))
      
      // Import customers one by one
      let successCount = 0
      let failedCount = 0
      
      for (const customer of customers) {
        try {
          const response = await fetch('/api/customers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(customer),
          })
          
          if (response.ok) {
            successCount++
            setImportStats(prev => ({ ...prev, success: successCount }))
          } else {
            failedCount++
            setImportStats(prev => ({ ...prev, failed: failedCount }))
          }
        } catch (error) {
          console.error('Error importing customer:', error)
          failedCount++
          setImportStats(prev => ({ ...prev, failed: failedCount }))
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} out of ${customers.length} customers!`)
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} customers failed to import. Please check the data format.`)
      }
    } catch (error) {
      toast.error('Error importing data')
    } finally {
      setImporting(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
  })

  return (
    <div className="space-y-8">
      {/* Export Section */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Data</h2>
        <p className="text-gray-600 mb-6">
          Download your customer data in CSV or Excel format
        </p>
        
        <div className="flex space-x-4">
          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export as CSV</span>
              </>
            )}
          </button>
          
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export as Excel</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Data</h2>
        <p className="text-gray-600 mb-6">
          Upload a CSV or Excel file to import customer data
        </p>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400'
          } ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} disabled={importing} />
          
          {importing ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
              <p className="text-sm text-gray-600">Importing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? 'Drop the file here...'
                    : 'Drag & drop a file here, or click to select'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  CSV, XLS, XLSX files supported
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Import Progress */}
        {importing && importStats.total > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-900">Import Progress</span>
              <span className="text-sm text-blue-700">
                {importStats.success + importStats.failed} / {importStats.total}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((importStats.success + importStats.failed) / importStats.total) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-blue-700">
              <span>✅ {importStats.success} successful</span>
              <span>❌ {importStats.failed} failed</span>
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          <p className="font-medium mb-2">Expected file format:</p>
          <p>Name, Contact, Email, Services, ServiceTakenBy, Amount, Discount, PaymentType, VisitDate, Notes</p>
          <p className="text-xs mt-1">
            Services should be separated by semicolons (;). Discount should be percentage (e.g., 15 for 15%). VisitDate should be in MM/DD/YYYY format. 
            <br />
            <strong>Note:</strong> FinalAmount is automatically calculated during export.
          </p>
          <div className="mt-3">
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = '/sample-customers.csv'
                link.download = 'sample-customers.csv'
                link.click()
              }}
              className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Sample Template</span>
            </button>
          </div>
        </div>
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

async function readFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        if (file.name.endsWith('.csv')) {
          resolve(e.target?.result)
        } else {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function parseImportData(data: any, filename: string) {
  let customers: any[] = []
  
  if (filename.endsWith('.csv')) {
    // Parse CSV data
    const lines = (data as string).split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const customer: any = {}
        
        headers.forEach((header, index) => {
          customer[header.toLowerCase()] = values[index] || ''
        })
        
        customers.push(processCustomerData(customer))
      }
    }
  } else {
    // Parse Excel data
    customers = (data as any[]).map(processCustomerData)
  }
  
  return customers.filter(c => c.name && c.contact) // Filter out invalid entries
}

function processCustomerData(customer: any) {
  return {
    name: customer.name || customer.Name || '',
    contact: customer.contact || customer.Contact || '',
    email: customer.email || customer.Email || '',
    services: customer.services ? 
      (customer.services.includes(';') ? 
        customer.services.split(';').map((s: string) => s.trim()) : 
        [customer.services]) : 
      [],
    amount: parseFloat(customer.amount || customer.Amount || '0'),
    discount: parseFloat(customer.discount || customer.Discount || '0'),
    paymentType: (customer.paymenttype || customer.PaymentType || 'CASH').toUpperCase(),
    notes: customer.notes || customer.Notes || ''
  }
}
