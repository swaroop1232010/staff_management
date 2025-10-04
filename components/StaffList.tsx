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

export default function StaffList() {
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

  const handleEdit = (staff: Staff) => {
    if (user?.role !== 'SUPERADMIN') {
      toast.error('Only administrators can edit staff members');
      return;
    }
    setEditingStaff(staff);
    setShowForm(true);
  };

  const handleAddNew = () => {
    if (user?.role !== 'SUPERADMIN') {
      toast.error('Only administrators can add staff members');
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
        {user?.role === 'SUPERADMIN' && (
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add New Staff
          </button>
        )}
      </div>

      {selectedStaff.length > 0 && user?.role === 'SUPERADMIN' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <span className="text-red-700">
              {selectedStaff.length} staff member(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {user?.role === 'SUPERADMIN' && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedStaff.length === staff.length && staff.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.email && <div>{member.email}</div>}
                        {member.phone && <div>{member.phone}</div>}
                        {!member.email && !member.phone && <div className="text-gray-400">No contact info</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {user?.role === 'SUPERADMIN' ? (
                        <>
                          <button
                            onClick={() => handleEdit(member)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">View Only</span>
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
