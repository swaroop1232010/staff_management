'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StaffList from '@/components/StaffList';
import Header from '@/components/Header';

export default function StaffPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string; } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header user={user} onNavigate={handleNavigation} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaffList />
      </div>
    </div>
  );
}
