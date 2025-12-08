import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Watch, AlertTriangle, Image as ImageIcon,
    Calendar, DollarSign, Clock, CheckCircle, XCircle,
    MessageSquare, ClipboardCheck
} from 'lucide-react';
import api from '../services/api';

const JobDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [watch, setWatch] = useState(null);
    const [conditions, setConditions] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [attachments, setAttachments] = useState([]);

    useEffect(() => {
        let mounted = true;

        const fetchJobDetails = async () => {
            // Avoid setting loading if we already have data for this ID to prevent flash
            // But here we want to show loading for new ID
            setLoading(true);
            try {
                // 1. Fetch Job
                const jobRes = await api.get(`/api/v1/jobs/${id}`);
                if (!mounted) return;

                const jobData = jobRes.data;
                setJob(jobData);

                // 2. Fetch Customer
                if (jobData.customer_id) {
                    try {
                        const customerRes = await api.get(`/api/v1/customers/${jobData.customer_id}`);
                        if (mounted) setCustomer(customerRes.data);
                    } catch (err) {
                        console.warn("Error fetching customer:", err);
                    }
                }

                // 3. Fetch Watch
                let watchData = jobData.watch;

                if (!watchData) {
                    try {
                        const watchRes = await api.get(`/api/v1/watches/job/${id}`);
                        if (mounted) watchData = watchRes.data;
                    } catch (err) {
                        console.warn("Could not fetch watch by job ID:", err);
                    }
                }

                if (mounted && watchData) {
                    setWatch(watchData);
                    const watchId = watchData.id;

                    // 4. Fetch Conditions
                    try {
                        const conditionsRes = await api.get(`/api/v1/conditions/watch-conditions/watch/${watchId}`);
                        if (mounted) setConditions(conditionsRes.data);
                    } catch (err) {
                        console.warn("Error fetching conditions:", err);
                    }

                    // 5. Fetch Complaints
                    try {
                        const complaintsRes = await api.get(`/api/v1/complaints/watch-complaints/watch/${watchId}`);
                        if (mounted) setComplaints(complaintsRes.data);
                    } catch (err) {
                        console.warn("Error fetching complaints:", err);
                    }

                    // 5. Fetch Attachments
                    try {
                        const attachmentsRes = await api.get(`/api/v1/watches/${watchId}/attachments`);
                        if (mounted) setAttachments(attachmentsRes.data);
                    } catch (err) {
                        console.warn("Error fetching attachments:", err);
                    }
                }

            } catch (error) {
                console.error("Error fetching job details:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (id) {
            fetchJobDetails();
        }

        return () => {
            mounted = false;
        };
    }, [id]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'watch', label: 'Watch Details', icon: Watch },
        { id: 'issues', label: 'Issues & Conditions', icon: AlertTriangle },
        { id: 'images', label: 'Images', icon: ImageIcon },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
                <button onClick={() => navigate('/jobs')} className="mt-4 text-blue-600 hover:underline">
                    Back to Jobs
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/jobs')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">Job #{job.id}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                                ${job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                {job.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <p className="text-gray-500 mt-1">
                            Created on {new Date(job.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Status Actions */}
                <div className="flex items-center gap-3">
                    <select
                        value={job.status}
                        onChange={async (e) => {
                            const newStatus = e.target.value;
                            if (window.confirm(`Are you sure you want to change status to ${newStatus}?`)) {
                                try {
                                    await api.post(`/api/v1/jobs/${job.id}/status`, {
                                        status: newStatus,
                                        notes: `Status updated to ${newStatus}`
                                    });
                                    // Update local state immediately
                                    setJob(prev => ({ ...prev, status: newStatus }));
                                } catch (err) {
                                    console.error("Failed to update status:", err);
                                    alert("Failed to update status");
                                }
                            }
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="booked">Booked</option>
                        <option value="indented">Indented</option>
                        <option value="waiting_for_parts">Waiting for Parts</option>
                        <option value="parts_received">Parts Received</option>
                        <option value="completed">Completed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>

                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
                <div className="flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                            {customer ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Name</span>
                                        <span className="font-medium text-gray-900">{customer.name}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Contact</span>
                                        <span className="font-medium text-gray-900">{customer.contact_number}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Email</span>
                                        <span className="font-medium text-gray-900">{customer.email || '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Address</span>
                                        <span className="font-medium text-gray-900 text-right">{customer.address || '-'}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">No customer information available.</p>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Estimated Cost</span>
                                    <span className="font-medium text-gray-900">${job.estimated_cost || '0.00'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Est. Parts Cost</span>
                                    <span className="font-medium text-gray-900">${job.estimated_parts_cost || '0.00'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Est. Labour Cost</span>
                                    <span className="font-medium text-gray-900">${job.estimated_labour_cost || '0.00'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Delivery Date</span>
                                    <span className="font-medium text-gray-900">
                                        {job.estimated_delivery_date ? new Date(job.estimated_delivery_date).toLocaleDateString() : '-'}
                                    </span>
                                </div>
                                {job.original_estimated_delivery_date && job.original_estimated_delivery_date !== job.estimated_delivery_date && (
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Original Est. Date</span>
                                        <span className="font-medium text-gray-500 line-through">
                                            {new Date(job.original_estimated_delivery_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'watch' && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Watch Information</h3>
                        {watch ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Brand ID</span>
                                        <span className="font-medium text-gray-900">{watch.brand_id}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Model Number</span>
                                        <span className="font-medium text-gray-900">{watch.model_number}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Serial Number</span>
                                        <span className="font-medium text-gray-900">{watch.watch_serial_number}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">Purchase Date</span>
                                        <span className="font-medium text-gray-900">
                                            {watch.date_of_purchase ? new Date(watch.date_of_purchase).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="text-gray-500">UCP Rate</span>
                                        <span className="font-medium text-gray-900">${watch.ucp_rate || '0.00'}</span>
                                    </div>
                                </div>
                                <div className="col-span-1 md:col-span-2 mt-4">
                                    <span className="text-gray-500 block mb-2">Other Remarks</span>
                                    <p className="p-4 bg-gray-50 rounded-lg text-gray-700">{watch.other_remarks || 'No remarks.'}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No watch details found.</p>
                        )}
                    </div>
                )}

                {activeTab === 'issues' && (
                    <div className="space-y-8">
                        {/* Complaints Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-red-500" />
                                Customer Complaints
                            </h3>
                            {complaints.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {complaints.map((item, index) => (
                                        <div key={index} className="p-4 bg-red-50 rounded-xl border border-red-100 transition-all hover:shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {item.complaint_node?.label || `Complaint ID: ${item.complaint_node_id}`}
                                                    </p>
                                                    {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 italic">No complaints recorded.</p>
                                </div>
                            )}
                        </div>

                        {/* Conditions Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-blue-500" />
                                Watch Conditions
                            </h3>
                            {conditions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {conditions.map((item, index) => (
                                        <div key={index} className="p-4 bg-blue-50 rounded-xl border border-blue-100 transition-all hover:shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {item.condition_node?.label || `Condition ID: ${item.condition_node_id}`}
                                                    </p>
                                                    {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 italic">No conditions recorded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'images' && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Watch Images</h3>
                        {attachments.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {attachments.map((img, index) => (
                                    <div key={index} className="relative group aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                        <img
                                            src={img.file_path || img.url} // Adjust based on actual API response
                                            alt={`Watch ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No images attached to this job.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetailsPage;
