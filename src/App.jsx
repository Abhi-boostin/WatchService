import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import JobListPage from './pages/JobListPage';
import JobDetailsPage from './pages/JobDetailsPage';
import CreateJobPage from './pages/CreateJobPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import CustomerListPage from './pages/CustomerListPage';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import ProfilePage from './pages/ProfilePage';
import SuppliersPage from './pages/SuppliersPage';
import BrandsPage from './pages/BrandsPage';
import IndentsPage from './pages/IndentsPage';
import ServiceParametersPage from './pages/ServiceParametersPage';
import ReportsPage from './pages/ReportsPage';
import PricingRulesPage from './pages/PricingRulesPage';
import SparePartsPage from './pages/SparePartsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/jobs" element={<JobListPage />} />
            <Route path="/jobs/new" element={<CreateJobPage />} />
            <Route path="/jobs/:id" element={<JobDetailsPage />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customers/:id" element={<CustomerDetailsPage />} />
            <Route path="/indents" element={<IndentsPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings/service-parameters" element={<ServiceParametersPage />} />
            <Route path="/settings/pricing-rules" element={<PricingRulesPage />} />
            <Route path="/settings/spare-parts" element={<SparePartsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Add other routes here later */}
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
