'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import StaffForm from './StaffForm';

interface Staff {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StaffListProps {
  onNavigate?: (path: string) => void;
}

export default function StaffList({ onNavigate }: StaffListProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    fetchStaff();
    // Get user role from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff');
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      } else {
        toast.error('Failed to fetch staff members');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to fetch staff members');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (user?.role !== 'SUPERADMIN') {
      toast.error('Only administrators can delete staff members');
      return;
    }
    if (!confirm('Are you sure you want to delete this staff member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Staff member deleted successfully');
        fetchStaff();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast.error('Failed to delete staff member');
    }
  };

  const handleBulkDelete = async () => {
    if (user?.role !== 'SUPERADMIN') {
      toast.error('Only administrators can delete staff members');
      return;
    }
    if (selectedStaff.length === 0) {
      toast.error('Please select staff members to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedStaff.length} staff member(s)?`)) {
      return;
    }

    try {
      const deletePromises = selectedStaff.map(id => 
        fetch(`/api/staff/${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      toast.success(`${selectedStaff.length} staff member(s) deleted successfully`);
      setSelectedStaff([]);
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff members:', error);
      toast.error('Failed to delete staff members');
    }
  };

  const handleSelectAll = () => {
    if (selectedStaff.length === staff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(staff.map(s => s.id));
    }
  };

  const handleSelectStaff = (id: string) => {
    setSelectedStaff(prev => 
      prev.includes(id) 
        ? prev.filter(staffId => staffId !== id)
        : [...prev, id]
    );
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingStaff(null);
    fetchStaff();
  };

  const handleNavigation = (path: string) => {
    // If in form mode, exit form mode first
    if (showForm) {
      setShowForm(false);
      setEditingStaff(null);
    }
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const handleEdit = (staff: Staff) => {
    if (user?.role !== 'SUPERADMIN') {
      toast.error('Only administrators can edit staff members');
      return;
    }
    setEditingStaff(staff);
    setShowForm(true);
  };

  const handleAddNew = () => {
    if (user?.role !== 'SUPERADMIN' && user?.role !== 'RECEPTIONIST') {
      toast.error('Only administrators and receptionists can add staff members');
      return;
    }
    setEditingStaff(null);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <StaffForm
        initialData={editingStaff || undefined}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setEditingStaff(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage salon stylists, specialists, and team roles</p>
        </div>
        {(user?.role === 'SUPERADMIN' || user?.role === 'RECEPTIONIST') && (
          <button
            onClick={handleAddNew}
            className="btn-primary flex items-center space-x-1.5"
          >
            <span>+</span>
            <span>Add New Staff</span>
          </button>
        )}
      </div>

      {selectedStaff.length > 0 && user?.role === 'SUPERADMIN' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center">
          <span className="text-red-800 text-sm font-semibold">
            {selectedStaff.length} staff member(s) selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-red-700 text-xs font-bold transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                {user?.role === 'SUPERADMIN' && (
                  <th className="px-6 py-3.5 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStaff.length === staff.length && staff.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No staff members found
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    {user?.role === 'SUPERADMIN' && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(member.id)}
                          onChange={() => handleSelectStaff(member.id)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{member.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                        {member.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                      {member.phone && <div className="font-mono">{member.phone}</div>}
                      {member.email && <div className="text-gray-400">{member.email}</div>}
                      {!member.email && !member.phone && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        member.isActive 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {member.isActive ? '● Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      {user?.role === 'SUPERADMIN' ? (
                        <>
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-primary-600 hover:text-primary-800 font-semibold text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600 hover:text-red-800 font-semibold text-xs"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
