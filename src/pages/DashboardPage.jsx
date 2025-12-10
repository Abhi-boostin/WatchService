import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Clock, CheckCircle,
    AlertCircle, Package, ChevronRight
} from 'lucide-react';
import api from '../services/api';

const DashboardPage = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        inProgress: 0,
        completed: 0,
        pending: 0
    });
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch stats by making parallel requests for counts
            // We use page_size=1 because we only care about the 'total' in the metadata
            const [
                allJobsRes,
                inProgressRes,
                completedRes,
                bookedRes
            ] = await Promise.all([
                api.get('/api/v1/jobs?page=1&page_size=1'),
                api.get('/api/v1/jobs?page=1&page_size=1&status_filter=in_progress'),
                api.get('/api/v1/jobs?page=1&page_size=1&status_filter=completed'),
                api.get('/api/v1/jobs?page=1&page_size=1&status_filter=booked')
            ]);

            // Fetch recent jobs (first 5)
            const recentJobsRes = await api.get('/api/v1/jobs?page=1&page_size=5&sort_by=created_at&sort_order=desc');

            setRecentJobs(recentJobsRes.data.items);

            setStats({
                total: allJobsRes.data.total,
                inProgress: inProgressRes.data.total,
                completed: completedRes.data.total,
                pending: bookedRes.data.total
            });
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${bgColor}`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <span className="text-2xl font-bold text-gray-900">{value}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
                </div>
                <button
                    onClick={() => navigate('/jobs/new')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors shadow-lg shadow-gray-900/20"
                >
                    <Plus size={20} />
                    <span>New Booking</span>
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Active Jobs"
                    value={stats.total}
                    icon={Package}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="In Progress"
                    value={stats.inProgress}
                    icon={Clock}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                />
                <StatCard
                    title="Ready for Delivery"
                    value={stats.pending}
                    icon={AlertCircle}
                    color="text-purple-600"
                    bgColor="bg-purple-50"
                />
                <StatCard
                    title="Completed Today"
                    value={stats.completed}
                    icon={CheckCircle}
                    color="text-green-600"
                    bgColor="bg-green-50"
                />
            </div>

            {/* Recent Jobs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
                    <button
                        onClick={() => navigate('/jobs')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                        View All <ChevronRight size={16} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : recentJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No recent jobs found</td>
                                </tr>
                            ) : (
                                recentJobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-mono text-sm font-medium text-gray-900">#{job.job_number || job.id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">Customer #{job.customer_id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {job.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{new Date(job.created_at).toLocaleDateString()}</span>
                                                <span className="text-xs text-gray-400">{new Date(job.created_at).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/jobs/${job.id}`)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                View
                                            </button>
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
};

export default DashboardPage;
