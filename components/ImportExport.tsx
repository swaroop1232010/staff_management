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
      
      if (customers.length === 0) {
        toast.error('No valid customer records found in file. Please check format.')
        setImporting(false)
        return
      }

      setImportStats({ success: 0, failed: 0, total: customers.length })
      
      // Attempt fast batch import first
      try {
        const batchRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customers),
        })

        if (batchRes.ok) {
          const batchData = await batchRes.json()
          const count = batchData.count || customers.length
          setImportStats({ success: count, failed: 0, total: customers.length })
          toast.success(`Successfully imported ${count} customers!`)
          setImporting(false)
          return
        }
      } catch (batchErr) {
        console.warn('Batch import failed, falling back to sequential import', batchErr)
      }

      // Sequential fallback
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
        toast.error(`${failedCount} customers failed to import. Please check contact numbers.`)
      }
    } catch (error: any) {
      console.error('Import processing error:', error)
      toast.error(error?.message || 'Error importing data')
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
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = '/swasthik_customers_clean.csv'
                link.download = 'swasthik_customers_clean.csv'
                link.click()
              }}
              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Cleaned File (255 Clients)</span>
            </button>

            <button
              onClick={async () => {
                try {
                  setImporting(true)
                  const res = await fetch('/swasthik_customers_clean.csv')
                  const blob = await res.blob()
                  const file = new File([blob], 'swasthik_customers_clean.csv', { type: 'text/csv' })
                  await onDrop([file])
                } catch {
                  toast.error('Failed to auto-load customer data')
                  setImporting(false)
                }
              }}
              disabled={importing}
              className="text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <span>⚡ Auto-Import 255 Prepared Clients</span>
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

async function readFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        const data = new Uint8Array(buffer)
        // XLSX.read handles CSV, XLS, and XLSX identically with high performance
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' })
        resolve(jsonData as any[])
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function parseImportData(data: any[], filename: string) {
  if (!Array.isArray(data)) return []
  return data
    .map(processCustomerData)
    .filter(c => c.name && c.contact) // Ensure name & contact exist
}

function processCustomerData(customer: any) {
  const name = String(customer.name || customer.Name || '').trim()
  const rawContact = customer.contact !== undefined ? customer.contact : (customer.Contact !== undefined ? customer.Contact : '')
  const contact = String(rawContact).trim()

  const rawServices = customer.services !== undefined ? customer.services : (customer.Services !== undefined ? customer.Services : '')
  let services: string[] = []
  if (Array.isArray(rawServices)) {
    services = rawServices.map((s: any) => String(s).trim()).filter(Boolean)
  } else if (typeof rawServices === 'string') {
    const trimmed = rawServices.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        services = Array.isArray(parsed) ? parsed.map(String).map((s: any) => s.trim()).filter(Boolean) : [String(parsed).trim()]
      } catch {
        services = [trimmed]
      }
    } else if (trimmed.includes(';')) {
      services = trimmed.split(';').map(s => s.trim()).filter(Boolean)
    } else if (trimmed.length > 0) {
      services = [trimmed]
    }
  }

  const rawStaff = customer.servicetakenby !== undefined ? customer.servicetakenby : (customer.ServiceTakenBy !== undefined ? customer.ServiceTakenBy : '')
  const rawAmount = customer.amount !== undefined ? customer.amount : (customer.Amount !== undefined ? customer.Amount : '0')
  const rawDiscount = customer.discount !== undefined ? customer.discount : (customer.Discount !== undefined ? customer.Discount : '0')
  const rawPayment = customer.paymenttype !== undefined ? customer.paymenttype : (customer.PaymentType !== undefined ? customer.PaymentType : 'CASH')
  const rawDate = customer.visitdate !== undefined ? customer.visitdate : (customer.VisitDate !== undefined ? customer.VisitDate : '')
  const rawNotes = customer.notes !== undefined ? customer.notes : (customer.Notes !== undefined ? customer.Notes : '')

  return {
    name,
    contact,
    email: customer.email || customer.Email || '',
    services: services.length > 0 ? services : ['Salon Service'],
    serviceTakenBy: rawStaff,
    amount: parseFloat(String(rawAmount || '0')) || 0,
    discount: parseFloat(String(rawDiscount || '0')) || 0,
    paymentType: String(rawPayment || 'CASH').trim().toUpperCase(),
    visitDate: rawDate || new Date().toISOString(),
    notes: rawNotes || ''
  }
}
