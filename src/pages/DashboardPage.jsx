import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-slate-800">Watch Service Center</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-600">Welcome, {user?.full_name || user?.username}</span>
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-slate-200 rounded-lg h-96 flex items-center justify-center">
            <p className="text-slate-500 text-lg">Dashboard Content Coming Soon</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
