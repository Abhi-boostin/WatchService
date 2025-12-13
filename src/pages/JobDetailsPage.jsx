import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Watch, AlertTriangle, Image as ImageIcon,
    Calendar, DollarSign, Clock, CheckCircle, XCircle,
    MessageSquare, ClipboardCheck, Pencil, Trash2, X, ClipboardList,
    Download, ZoomIn, Package, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import HierarchicalNodeSelector from '../components/common/HierarchicalNodeSelector';

const JobDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [watch, setWatch] = useState(null);
    const [indents, setIndents] = useState([]);
    const [conditions, setConditions] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [brands, setBrands] = useState([]);
    const [availableComplaints, setAvailableComplaints] = useState([]);
    const [availableConditions, setAvailableConditions] = useState([]);

    // Refs for scroll spy
    const sectionRefs = React.useRef({});

    // Image state
    const [imageUrls, setImageUrls] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);

    // Modal States
    const [modalType, setModalType] = useState(null); // 'edit', 'delete', 'delay'
    const [editTab, setEditTab] = useState('job'); // 'job', 'watch', 'customer', 'issues'
    const [formData, setFormData] = useState({});
    const [isRecalculating, setIsRecalculating] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchJobDetails = async () => {
            setLoading(true);
            try {
                // 1. Fetch Job
                const jobRes = await api.get(`/api/v1/jobs/${id}`);
                if (!mounted) return;

                const jobData = jobRes.data;
                setJob(jobData);

                // 2. Extract Customer from embedded data
                if (jobData.customer) {
                    if (mounted) setCustomer(jobData.customer);
                }

                // 3. Extract Watch from embedded data
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
                }

                // 4. Extract Indents from embedded data
                if (jobData.indents && Array.isArray(jobData.indents)) {
                    if (mounted) setIndents(jobData.indents);
                }

                // 5. Fetch watch-related data (conditions, complaints, attachments)
                if (mounted && watchData) {
                    const watchId = watchData.id;

                    // 5a. Fetch Conditions
                    try {
                        const conditionsRes = await api.get(`/api/v1/conditions/watch-conditions/watch/${watchId}`);
                        if (mounted) setConditions(conditionsRes.data);
                    } catch (err) {
                        console.warn("Error fetching conditions:", err);
                    }

                    // 5b. Fetch Complaints
                    try {
                        const complaintsRes = await api.get(`/api/v1/complaints/watch-complaints/watch/${watchId}`);
                        if (mounted) setComplaints(complaintsRes.data);
                    } catch (err) {
                        console.warn("Error fetching complaints:", err);
                    }

                    // 5c. Fetch Attachments
                    try {
                        const attachmentsRes = await api.get(`/api/v1/watches/${watchId}/attachments`);
                        if (mounted) setAttachments(attachmentsRes.data);
                    } catch (err) {
                        console.warn("Error fetching attachments:", err);
                    }
                }

                // 6. Fetch Brands (for editing)
                try {
                    const brandsRes = await api.get('/api/v1/brands/all');
                    if (mounted) setBrands(brandsRes.data);
                } catch (err) {
                    console.warn("Error fetching brands:", err);
                }

                // 7. Fetch Complaint Nodes (keep as tree structure)
                try {
                    const compNodesRes = await api.get('/api/v1/complaints/nodes');
                    if (mounted) setAvailableComplaints(compNodesRes.data);
                } catch (err) {
                    console.warn("Error fetching complaint nodes:", err);
                }

                // 8. Fetch Condition Nodes (keep as tree structure)
                try {
                    const condNodesRes = await api.get('/api/v1/conditions/nodes');
                    if (mounted) setAvailableConditions(condNodesRes.data);
                } catch (err) {
                    console.warn("Error fetching condition nodes:", err);
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

    // Fetch images with authentication
    useEffect(() => {
        const fetchImages = async () => {
            const urls = {};
            for (const attachment of attachments) {
                try {
                    const response = await api.get(`/api/v1/attachments/watch/${attachment.id}`, {
                        responseType: 'blob'
                    });
                    const url = URL.createObjectURL(response.data);
                    urls[attachment.id] = url;
                } catch (error) {
                    console.error(`Error fetching image ${attachment.id}:`, error);
                }
            }
            setImageUrls(urls);
        };

        if (attachments.length > 0) {
            fetchImages();
        }

        // Cleanup: revoke object URLs when component unmounts
        return () => {
            Object.values(imageUrls).forEach(url => URL.revokeObjectURL(url));
        };
    }, [attachments]);

    // Scroll spy with IntersectionObserver
    useEffect(() => {
        // Wait for sections to be rendered
        if (loading || !job) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                rootMargin: '-120px 0px -50% 0px'
            }
        );

        // Small delay to ensure refs are set
        const timeoutId = setTimeout(() => {
            Object.values(sectionRefs.current).forEach((ref) => {
                if (ref) {
                    observer.observe(ref);
                }
            });
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            observer.disconnect();
        };
    }, [loading, job]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'watch', label: 'Watch Details', icon: Watch },
        { id: 'issues', label: 'Issues & Conditions', icon: AlertTriangle },
        { id: 'images', label: 'Images', icon: ImageIcon },
        { id: 'indents', label: 'Indents & Parts', icon: Package },
    ];

    // Actions
    const openEditModal = () => {
        setFormData({
            // Job Fields
            estimated_cost: job.estimated_cost,
            estimated_parts_cost: job.estimated_parts_cost,
            estimated_labour_cost: job.estimated_labour_cost,
            deduction: job.deduction,
            deduction_note: job.deduction_note,
            additional_charge: job.additional_charge,
            additional_charge_note: job.additional_charge_note,
            actual_cost: job.actual_cost,
            estimated_delivery_date: job.estimated_delivery_date,
            notes: job.notes,

            // Watch Fields
            brand_id: watch?.brand_id || '',
            model_number: watch?.model_number || '',
            watch_serial_number: watch?.watch_serial_number || '',
            other_remarks: watch?.other_remarks || '',
            ucp_rate: watch?.ucp_rate || '',
            date_of_purchase: watch?.date_of_purchase || '',

            // Customer Fields
            customer_name: customer?.name || '',
            customer_contact: customer?.contact_number || '',
            customer_email: customer?.email || '',
            customer_address: customer?.address || '',

            // Issues Fields (IDs only for selection)
            selected_complaint_ids: complaints.map(c => c.complaint_node_id),
            selected_condition_ids: conditions.map(c => c.condition_node_id)
        });
        setEditTab('job');
        setModalType('edit');
    };

    const openDeleteModal = () => {
        setModalType('delete');
    };

    const openDelayModal = () => {
        setFormData({
            delay_reason: '',
            new_estimated_delivery_date: job.estimated_delivery_date || ''
        });
        setModalType('delay');
    };

    const closeModal = () => {
        setModalType(null);
        setFormData({});
    };

    // Toggle handlers for hierarchical node selection
    const handleComplaintToggle = (nodeId) => {
        const currentIds = formData.selected_complaint_ids || [];
        const newIds = currentIds.includes(nodeId)
            ? currentIds.filter(id => id !== nodeId)
            : [...currentIds, nodeId];
        setFormData({ ...formData, selected_complaint_ids: newIds });
    };

    const handleConditionToggle = (nodeId) => {
        const currentIds = formData.selected_condition_ids || [];
        const newIds = currentIds.includes(nodeId)
            ? currentIds.filter(id => id !== nodeId)
            : [...currentIds, nodeId];
        setFormData({ ...formData, selected_condition_ids: newIds });
    };

    const handleUpdateJob = async (e) => {
        e.preventDefault();
        try {
            // 1. Update Job
            const jobData = {
                estimated_cost: formData.estimated_cost,
                estimated_parts_cost: formData.estimated_parts_cost,
                estimated_labour_cost: formData.estimated_labour_cost,
                deduction: formData.deduction,
                deduction_note: formData.deduction_note,
                additional_charge: formData.additional_charge,
                additional_charge_note: formData.additional_charge_note,
                actual_cost: formData.actual_cost,
                estimated_delivery_date: formData.estimated_delivery_date,
                notes: formData.notes
            };
            const jobRes = await api.patch(`/api/v1/jobs/${id}`, jobData);
            setJob(jobRes.data);

            // 2. Update Watch (if exists)
            if (watch) {
                const watchData = {
                    brand_id: formData.brand_id,
                    model_number: formData.model_number,
                    watch_serial_number: formData.watch_serial_number,
                    other_remarks: formData.other_remarks,
                    ucp_rate: formData.ucp_rate,
                    date_of_purchase: formData.date_of_purchase
                };
                const watchRes = await api.patch(`/api/v1/watches/${watch.id}`, watchData);
                setWatch(watchRes.data);

                // 3. Update Issues (Complaints)
                const currentComplaintIds = complaints.map(c => c.complaint_node_id);
                const newComplaintIds = formData.selected_complaint_ids.map(Number);

                const complaintsToAdd = newComplaintIds.filter(id => !currentComplaintIds.includes(id));
                const complaintsToRemove = complaints.filter(c => !newComplaintIds.includes(c.complaint_node_id));

                // Add new complaints
                for (const nodeId of complaintsToAdd) {
                    await api.post('/api/v1/complaints/watch-complaints', {
                        watch_id: watch.id,
                        complaint_node_id: nodeId
                    });
                }
                // Remove deselected complaints
                for (const item of complaintsToRemove) {
                    await api.delete(`/api/v1/complaints/watch-complaints/${item.id}`);
                }

                // Refresh complaints
                const updatedComplaints = await api.get(`/api/v1/complaints/watch-complaints/watch/${watch.id}`);
                setComplaints(updatedComplaints.data);


                // 4. Update Issues (Conditions)
                const currentConditionIds = conditions.map(c => c.condition_node_id);
                const newConditionIds = formData.selected_condition_ids.map(Number);

                const conditionsToAdd = newConditionIds.filter(id => !currentConditionIds.includes(id));
                const conditionsToRemove = conditions.filter(c => !newConditionIds.includes(c.condition_node_id));

                // Add new conditions
                for (const nodeId of conditionsToAdd) {
                    await api.post('/api/v1/conditions/watch-conditions', {
                        watch_id: watch.id,
                        condition_node_id: nodeId
                    });
                }
                // Remove deselected conditions
                for (const item of conditionsToRemove) {
                    await api.delete(`/api/v1/conditions/watch-conditions/${item.id}`);
                }

                // Refresh conditions
                const updatedConditions = await api.get(`/api/v1/conditions/watch-conditions/watch/${watch.id}`);
                setConditions(updatedConditions.data);
            }

            // 5. Update Customer (if exists)
            if (customer) {
                const customerData = {
                    name: formData.customer_name,
                    contact_number: formData.customer_contact,
                    email: formData.customer_email,
                    address: formData.customer_address
                };
                const customerRes = await api.patch(`/api/v1/customers/${customer.id}`, customerData);
                setCustomer(customerRes.data);
            }

            closeModal();
        } catch (error) {
            console.error("Error updating details:", error);
            alert("Failed to update details");
        }
    };

    const handleDeleteJob = async () => {
        try {
            await api.delete(`/api/v1/jobs/${id}`);
            navigate('/jobs');
        } catch (error) {
            console.error("Error deleting job:", error);
            alert("Failed to delete job");
        }
    };

    const handleDelayJob = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post(`/api/v1/jobs/${id}/delay`, formData);
            setJob(response.data);
            closeModal();
        } catch (error) {
            console.error("Error adding delay:", error);
            alert("Failed to add delay");
        }
    };

    const handleRecalculatePricing = async () => {
        if (!job || !watch) {
            alert("Job or watch information is not available.");
            return;
        }
        
        try {
            setIsRecalculating(true);
            const response = await api.post(`/api/v1/jobs/${id}/recalculate-pricing`, {
                apply_to_job: true
            });
            
            // Update the job with new pricing
            if (response.data && response.data.estimate) {
                const estimate = response.data.estimate;
                setJob(prev => ({
                    ...prev,
                    estimated_cost: estimate.estimated_total,
                    estimated_parts_cost: estimate.total_parts_cost,
                    estimated_labour_cost: estimate.total_labour_cost
                }));
                alert(`Pricing recalculated successfully!\nEstimated Total: ₹${parseFloat(estimate.estimated_total).toFixed(2)}`);
            } else {
                alert("Pricing recalculated successfully!");
            }
        } catch (error) {
            console.error("Error recalculating pricing:", error);
            alert("Failed to recalculate pricing. Please try again.");
        } finally {
            setIsRecalculating(false);
        }
    };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    {/* Title Section */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/jobs')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-gray-900">Job #{job.job_number || job.id}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                                    ${job.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        job.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        job.status === 'indented' || job.status === 'parts_received' ? 'bg-blue-100 text-blue-800' :
                                        job.status === 'booked' ? 'bg-yellow-100 text-yellow-800' :
                                        job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'}`}>
                                    {job.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <p className="text-gray-500 mt-1">
                                Created on {new Date(job.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Status Dropdown - Visible on larger screens */}
                    <div className="hidden lg:block">
                        <label className="block text-xs text-gray-500 mb-1 font-medium">Update Status</label>
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
                                        setJob(prev => ({ ...prev, status: newStatus }));
                                    } catch (err) {
                                        console.error("Failed to update status:", err);
                                        alert("Failed to update status");
                                    }
                                }
                            }}
                            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors min-w-[180px]"
                        >
                            <option value="booked">Booked</option>
                            <option value="indented">Indented</option>
                            <option value="parts_received">Parts Received</option>
                            <option value="completed">Completed</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Primary Actions */}
                    <div className="flex flex-wrap gap-2 flex-1">
                        <button
                            onClick={openEditModal}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-medium text-sm"
                        >
                            <Pencil size={16} />
                            <span>Edit</span>
                        </button>
                        <button
                            onClick={handleRecalculatePricing}
                            disabled={isRecalculating}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <DollarSign size={16} />
                            <span className="hidden sm:inline">{isRecalculating ? 'Calculating...' : 'Recalculate'}</span>
                            <span className="sm:hidden">Price</span>
                        </button>
                        <button
                            onClick={openDelayModal}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-orange-600 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm font-medium text-sm"
                        >
                            <Clock size={16} />
                            <span>Delay</span>
                        </button>
                        <button
                            onClick={openDeleteModal}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm font-medium text-sm"
                        >
                            <Trash2 size={16} />
                            <span>Delete</span>
                        </button>
                    </div>

                    {/* Status Dropdown - Mobile/Tablet */}
                    <div className="lg:hidden">
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
                                        setJob(prev => ({ ...prev, status: newStatus }));
                                    } catch (err) {
                                        console.error("Failed to update status:", err);
                                        alert("Failed to update status");
                                    }
                                }
                            }}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <option value="booked">Status: Booked</option>
                            <option value="indented">Status: Indented</option>
                            <option value="parts_received">Status: Parts Received</option>
                            <option value="completed">Status: Completed</option>
                            <option value="delivered">Status: Delivered</option>
                            <option value="cancelled">Status: Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - Sticky */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div className="flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    document.getElementById(tab.id)?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start'
                                    });
                                }}
                                className={`
                                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                                    ${activeSection === tab.id
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

            {/* Content - All Sections Visible */}
            <div className="space-y-8">
                {/* Overview Section */}
                <section 
                    id="overview" 
                    ref={el => sectionRefs.current.overview = el}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 scroll-mt-24"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Overview</h2>
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
                                    <span className="font-medium text-gray-900">₹{job.estimated_cost || '0.00'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Est. Parts Cost</span>
                                    <span className="font-medium text-gray-900">₹{job.estimated_parts_cost || '0.00'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Est. Labour Cost</span>
                                    <span className="font-medium text-gray-900">₹{job.estimated_labour_cost || '0.00'}</span>
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
                                {job.delay_reason && (
                                    <div className="py-2 border-b border-gray-100">
                                        <span className="text-gray-500 block mb-1">Delay Reason</span>
                                        <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                            {job.delay_reason}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Watch Details Section */}
                <section 
                    id="watch" 
                    ref={el => sectionRefs.current.watch = el}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 scroll-mt-24"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Watch Details</h2>
                    {watch ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Brand</span>
                                    <span className="font-medium text-gray-900">{watch.brand?.name || watch.brand_id || '-'}</span>
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
                                    <span className="font-medium text-gray-900">₹{watch.ucp_rate || '0.00'}</span>
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
                </section>

                {/* Issues & Conditions Section */}
                <section 
                    id="issues" 
                    ref={el => sectionRefs.current.issues = el}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 scroll-mt-24"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Issues & Conditions</h2>
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
                </section>

                {/* Images Section */}
                <section 
                    id="images" 
                    ref={el => sectionRefs.current.images = el}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 scroll-mt-24"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Watch Images & Attachments</h2>
                    {attachments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {attachments.map((attachment, index) => (
                                <div key={attachment.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                                    {/* Image Preview */}
                                    <div className="relative aspect-video bg-gray-100 group cursor-pointer" onClick={() => setSelectedImage(attachment)}>
                                        {imageUrls[attachment.id] ? (
                                            <>
                                                <img
                                                    src={imageUrls[attachment.id]}
                                                    alt={attachment.file_name || `Attachment ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Metadata */}
                                    <div className="p-4 space-y-3">
                                        {/* Filename */}
                                        <div>
                                            <h4 className="font-medium text-gray-900 truncate" title={attachment.file_name}>
                                                {attachment.file_name || `attachment_${attachment.id}`}
                                            </h4>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <Calendar size={12} />
                                                <span>{attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleDateString() : '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <ImageIcon size={12} />
                                                <span>{attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : '-'}</span>
                                            </div>
                                        </div>

                                        {/* Association Badge */}
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                                                <Watch size={12} />
                                                Watch
                                            </span>
                                            {attachment.mime_type && (
                                                <span className="text-xs text-gray-400 uppercase">
                                                    {attachment.mime_type.split('/')[1]}
                                                </span>
                                            )}
                                        </div>

                                        {/* Download Button */}
                                        <button
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = imageUrls[attachment.id];
                                                link.download = attachment.file_name || `attachment_${attachment.id}`;
                                                link.click();
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <Download size={16} />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No images attached to this job.</p>
                        </div>
                    )}
                </section>

                {/* Indents & Parts Section */}
                <section 
                    id="indents" 
                    ref={el => sectionRefs.current.indents = el}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 scroll-mt-24"
                >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Indents & Parts</h2>
                    {indents.length > 0 ? (
                        <div className="space-y-4">
                            {indents.map((indent) => (
                                <div 
                                    key={indent.id}
                                    onClick={() => navigate(`/indents/${indent.id}`)}
                                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            {/* Header Row */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-5 h-5 text-blue-600" />
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        Indent #{indent.serial_number || indent.id}
                                                    </h3>
                                                </div>
                                                {indent.parts && indent.parts.length > 0 && (
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                        {indent.parts.length} {indent.parts.length === 1 ? 'Part' : 'Parts'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Supplier and Details */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Supplier</p>
                                                    <p className="font-medium text-gray-900">
                                                        {indent.supplier?.name || 'N/A'}
                                                    </p>
                                                    {indent.supplier?.contact_number && (
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                            {indent.supplier.contact_number}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Created Date</p>
                                                    <p className="font-medium text-gray-900">
                                                        {indent.created_at ? new Date(indent.created_at).toLocaleDateString() : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                                                    <p className="font-medium text-gray-900">
                                                        {indent.updated_at ? new Date(indent.updated_at).toLocaleDateString() : '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Notes */}
                                            {indent.notes && (
                                                <div className="pt-2 border-t border-gray-100">
                                                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                                                    <p className="text-sm text-gray-700">{indent.notes}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Arrow Icon */}
                                        <div className="flex items-center">
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No indents created for this job yet.</p>
                            <p className="text-sm text-gray-400 mt-2">Indents will appear here once parts are ordered.</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Modals */}
            {modalType && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalType === 'edit' && 'Edit Job Details'}
                                {modalType === 'delete' && 'Delete Job'}
                                {modalType === 'delay' && 'Add Job Delay'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {modalType === 'edit' && (
                                <form onSubmit={handleUpdateJob} className="space-y-4">
                                    {/* Edit Tabs */}
                                    <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                                        {['job', 'watch', 'customer', 'issues'].map(tab => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setEditTab(tab)}
                                                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap px-4
                                                    ${editTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {tab} Details
                                            </button>
                                        ))}
                                    </div>

                                    {editTab === 'job' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Cost</label>
                                                    <input type="number" step="0.01" value={formData.estimated_cost} onChange={e => setFormData({ ...formData, estimated_cost: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Delivery</label>
                                                    <input type="date" value={formData.estimated_delivery_date?.split('T')[0]} onChange={e => setFormData({ ...formData, estimated_delivery_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" rows="3"></textarea>
                                            </div>
                                        </div>
                                    )}

                                    {editTab === 'watch' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                                <select
                                                    value={formData.brand_id}
                                                    onChange={e => setFormData({ ...formData, brand_id: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white"
                                                >
                                                    <option value="">Select Brand</option>
                                                    {brands.map(brand => (
                                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
                                                    <input type="text" value={formData.model_number} onChange={e => setFormData({ ...formData, model_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                                                    <input type="text" value={formData.watch_serial_number} onChange={e => setFormData({ ...formData, watch_serial_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">UCP Rate</label>
                                                    <input type="number" step="0.01" value={formData.ucp_rate} onChange={e => setFormData({ ...formData, ucp_rate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                                                    <input type="date" value={formData.date_of_purchase?.split('T')[0]} onChange={e => setFormData({ ...formData, date_of_purchase: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Other Remarks</label>
                                                <textarea value={formData.other_remarks} onChange={e => setFormData({ ...formData, other_remarks: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" rows="2"></textarea>
                                            </div>
                                        </div>
                                    )}

                                    {editTab === 'customer' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                                <input type="text" value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                                                    <input type="text" value={formData.customer_contact} onChange={e => setFormData({ ...formData, customer_contact: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                    <input type="email" value={formData.customer_email} onChange={e => setFormData({ ...formData, customer_email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                                <textarea value={formData.customer_address} onChange={e => setFormData({ ...formData, customer_address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" rows="3"></textarea>
                                            </div>
                                        </div>
                                    )}

                                    {editTab === 'issues' && (
                                        <div className="space-y-6">
                                            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <ClipboardList className="w-4 h-4 text-blue-600" />
                                                    Service Requirements & Conditions
                                                </h3>

                                                <div className="space-y-6">
                                                    {/* Condition Tree */}
                                                    <HierarchicalNodeSelector
                                                        nodes={availableConditions}
                                                        selectedIds={formData.selected_condition_ids || []}
                                                        onToggle={handleConditionToggle}
                                                        label="Watch Conditions & Issues"
                                                        emptyMessage="No conditions available"
                                                    />

                                                    {/* Complaints Tree */}
                                                    <HierarchicalNodeSelector
                                                        nodes={availableComplaints}
                                                        selectedIds={formData.selected_complaint_ids || []}
                                                        onToggle={handleComplaintToggle}
                                                        label="Customer Complaints"
                                                        emptyMessage="No complaints available"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'delete' && (
                                <div>
                                    <div className="flex items-center gap-4 mb-6 bg-red-50 p-4 rounded-xl text-red-700">
                                        <AlertTriangle size={24} />
                                        <p>Are you sure you want to delete this job? This action cannot be undone.</p>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button onClick={handleDeleteJob} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete Job</button>
                                    </div>
                                </div>
                            )}

                            {modalType === 'delay' && (
                                <form onSubmit={handleDelayJob} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Delivery Date</label>
                                        <input type="date" required value={formData.new_estimated_delivery_date?.split('T')[0]} onChange={e => setFormData({ ...formData, new_estimated_delivery_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Delay Reason</label>
                                        <textarea required value={formData.delay_reason} onChange={e => setFormData({ ...formData, delay_reason: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" rows="3" placeholder="Explain why the job is delayed..."></textarea>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Add Delay</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Lightbox Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" 
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-7xl max-h-full" onClick={e => e.stopPropagation()}>
                        {/* Close Button */}
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X size={32} />
                        </button>

                        {/* Image */}
                        <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                            <img
                                src={imageUrls[selectedImage.id]}
                                alt={selectedImage.file_name}
                                className="max-h-[80vh] w-auto mx-auto"
                            />
                            
                            {/* Image Info Bar */}
                            <div className="p-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {selectedImage.file_name || `Attachment ${selectedImage.id}`}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {selectedImage.uploaded_at ? new Date(selectedImage.uploaded_at).toLocaleDateString() : '-'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ImageIcon size={14} />
                                                {selectedImage.file_size ? `${(selectedImage.file_size / 1024).toFixed(1)} KB` : '-'}
                                            </span>
                                            {selectedImage.mime_type && (
                                                <span className="uppercase">{selectedImage.mime_type}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = imageUrls[selectedImage.id];
                                            link.download = selectedImage.file_name || `attachment_${selectedImage.id}`;
                                            link.click();
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                    >
                                        <Download size={18} />
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetailsPage;
