import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Watch, AlertTriangle, Image as ImageIcon,
    Calendar, DollarSign, Clock, CheckCircle, XCircle,
    MessageSquare, ClipboardCheck, Pencil, Trash2, X, ClipboardList,
    Download, ZoomIn, Package, ChevronRight, FileText, History
} from 'lucide-react';
import api from '../services/api';
import { auditService } from '../services/api';
import HierarchicalNodeSelector from '../components/common/HierarchicalNodeSelector';
import AuditTimeline from '../components/common/AuditTimeline';
import { exportJobPDF } from '../services/pdfService';
import { getErrorMessage } from '../utils/errorUtils';
import { calculateDeliveryDate } from '../utils/dateUtils';

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
    const [spareParts, setSpareParts] = useState([]);
    
    // User state for permissions
    const [currentUser, setCurrentUser] = useState(null);
    
    // Audit history state - standalone modal
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [auditEvents, setAuditEvents] = useState([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditError, setAuditError] = useState(null);
    const [auditPage, setAuditPage] = useState(1);
    const [auditTotalPages, setAuditTotalPages] = useState(1);

    // Refs for scroll spy
    const sectionRefs = React.useRef({});

    // Image state
    const [imageUrls, setImageUrls] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);

    // Modal States
    const [modalType, setModalType] = useState(null); // 'edit', 'delete', 'delay', 'create-indent'
    const [editTab, setEditTab] = useState('job'); // 'job', 'watch', 'customer', 'issues'
    const [formData, setFormData] = useState({});
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    // Indent creation state
    const [indentSuggestions, setIndentSuggestions] = useState(null);
    const [indentFormData, setIndentFormData] = useState({
        supplier_id: '',
        notes: '',
        selected_parts: {}, // { spare_part_id: quantity }
    });
    const [suppliers, setSuppliers] = useState([]);
    const [isCreatingIndent, setIsCreatingIndent] = useState(false);

    // Fetch current user for permissions
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await api.get('/api/v1/auth/me');
                setCurrentUser(response.data);
            } catch (error) {
                console.error("Failed to fetch current user:", error);
            }
        };
        fetchCurrentUser();
    }, []);

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

                // 9. Fetch Spare Parts
                try {
                    const sparePartsRes = await api.get('/api/v1/spare-parts/all');
                    if (mounted) setSpareParts(sparePartsRes.data || []);
                } catch (err) {
                    console.warn("Error fetching spare parts:", err);
                }

                // 10. Fetch Suppliers (for indent creation)
                try {
                    const suppliersRes = await api.get('/api/v1/suppliers/all');
                    if (mounted) setSuppliers(suppliersRes.data || []);
                } catch (err) {
                    console.warn("Error fetching suppliers:", err);
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
            selected_condition_ids: conditions.map(c => c.condition_node_id),
            
            // Complaint spare parts metadata
            complaint_spare_parts: complaints.reduce((acc, c) => {
                if (c.indent_required || c.spare_part_id) {
                    acc[c.complaint_node_id] = {
                        complaint_watch_id: c.id, // Store the watch_complaint ID for updates
                        indent_required: c.indent_required || false,
                        spare_part_id: c.spare_part_id || null
                    };
                }
                return acc;
            }, {})
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
        setEditTab('job'); // Reset to default tab
    };
    
    // Audit history functions
    const handleOpenAuditModal = () => {
        setShowAuditModal(true);
        fetchAuditHistory(1);
    };
    
    const handleCloseAuditModal = () => {
        setShowAuditModal(false);
        setAuditEvents([]);
        setAuditError(null);
        setAuditPage(1);
    };
    
    // Fetch audit history
    const fetchAuditHistory = async (page = 1) => {
        if (!job) return;
        
        setAuditLoading(true);
        setAuditError(null);
        try {
            const response = await auditService.getJobAuditHistory(job.id, page, 20);
            setAuditEvents(response || []);
            setAuditTotalPages(response && response.length === 20 ? page + 1 : page);
        } catch (error) {
            console.error("Failed to fetch audit history:", error);
            setAuditError(getErrorMessage(error, "Failed to load audit history"));
        } finally {
            setAuditLoading(false);
        }
    };
    
    const handleAuditPageChange = (newPage) => {
        setAuditPage(newPage);
        fetchAuditHistory(newPage);
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

    const handleComplaintSparePartChange = (complaintNodeId, field, value) => {
        setFormData(prev => ({
            ...prev,
            complaint_spare_parts: {
                ...prev.complaint_spare_parts,
                [complaintNodeId]: {
                    ...(prev.complaint_spare_parts?.[complaintNodeId] || {}),
                    [field]: value
                }
            }
        }));
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

                // 3. Update Issues (Complaints with spare parts metadata)
                const currentComplaintIds = complaints.map(c => c.complaint_node_id);
                const newComplaintIds = formData.selected_complaint_ids.map(Number);

                const complaintsToAdd = newComplaintIds.filter(id => !currentComplaintIds.includes(id));
                const complaintsToRemove = complaints.filter(c => !newComplaintIds.includes(c.complaint_node_id));

                // Add new complaints (with metadata if available)
                for (const nodeId of complaintsToAdd) {
                    const metadata = formData.complaint_spare_parts?.[nodeId] || {};
                    await api.post('/api/v1/complaints/watch-complaints', {
                        watch_id: watch.id,
                        complaint_node_id: nodeId,
                        indent_required: metadata.indent_required || false,
                        spare_part_id: metadata.spare_part_id || null
                    });
                }
                
                // Remove deselected complaints
                for (const item of complaintsToRemove) {
                    await api.delete(`/api/v1/complaints/watch-complaints/${item.id}`);
                }

                // Update existing complaints with spare parts metadata
                for (const complaintNodeId of newComplaintIds) {
                    const metadata = formData.complaint_spare_parts?.[complaintNodeId];
                    if (metadata && metadata.complaint_watch_id) {
                        // This is an existing complaint, update its metadata
                        await api.patch(`/api/v1/complaints/watch-complaints/${metadata.complaint_watch_id}`, {
                            indent_required: metadata.indent_required || false,
                            spare_part_id: metadata.spare_part_id || null
                        });
                    }
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
            alert(getErrorMessage(error, "Failed to update details"));
        }
    };

    const handleDeleteJob = async () => {
        try {
            await api.delete(`/api/v1/jobs/${id}`);
            navigate('/jobs');
        } catch (error) {
            console.error("Error deleting job:", error);
            alert(getErrorMessage(error, "Failed to delete job"));
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
            alert(getErrorMessage(error, "Failed to add delay"));
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
                
                // Calculate new delivery date if max_estimated_delivery_days is provided
                let updatedDeliveryDate = job.estimated_delivery_date;
                if (estimate.max_estimated_delivery_days != null) {
                    updatedDeliveryDate = calculateDeliveryDate(estimate.max_estimated_delivery_days);
                    
                    // Update the job with the new delivery date via API
                    try {
                        await api.patch(`/api/v1/jobs/${id}`, {
                            estimated_delivery_date: updatedDeliveryDate
                        });
                    } catch (patchError) {
                        console.error("Error updating delivery date:", patchError);
                        // Continue with pricing update even if delivery date update fails
                    }
                }
                
                setJob(prev => ({
                    ...prev,
                    estimated_cost: estimate.estimated_total,
                    estimated_parts_cost: estimate.total_parts_cost,
                    estimated_labour_cost: estimate.total_labour_cost,
                    estimated_delivery_date: updatedDeliveryDate
                }));
                
                const deliveryMessage = estimate.max_estimated_delivery_days != null 
                    ? `\nDelivery Date: ${new Date(updatedDeliveryDate).toLocaleDateString('en-IN')} (${estimate.max_estimated_delivery_days} days)`
                    : '';
                alert(`Pricing recalculated successfully!\nEstimated Total: ₹${parseFloat(estimate.estimated_total).toFixed(2)}${deliveryMessage}`);
            } else {
                alert("Pricing recalculated successfully!");
            }
        } catch (error) {
            console.error("Error recalculating pricing:", error);
            alert(getErrorMessage(error, "Failed to recalculate pricing. Please try again."));
        } finally {
            setIsRecalculating(false);
        }
    };

    const handleExportPDF = async () => {
        if (!job) {
            alert("Job information is not available.");
            return;
        }

        try {
            setIsExportingPDF(true);
            const jobNumber = job.job_number || `#${job.id}`;
            await exportJobPDF(job.id, jobNumber);
            
            // Success feedback
            setTimeout(() => {
                alert("PDF exported successfully! Check your downloads folder.");
            }, 500);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            alert(getErrorMessage(error, "Failed to export PDF. Please try again."));
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleOpenIndentModal = async () => {
        if (!watch) {
            alert("Watch information not available.");
            return;
        }

        try {
            setIsCreatingIndent(true);
            // Fetch indent suggestions
            const response = await api.get(`/api/v1/complaints/watch-complaints/watch/${watch.id}/indent-suggestions`);
            setIndentSuggestions(response.data);

            if (response.data.total_parts_required === 0) {
                alert("No spare parts are required for this watch's complaints.");
                return;
            }

            // Initialize selected parts (all selected by default)
            const initialSelectedParts = {};
            response.data.suggestions.forEach(suggestion => {
                initialSelectedParts[suggestion.spare_part.id] = 1; // Default quantity: 1
            });

            setIndentFormData({
                supplier_id: '',
                notes: '',
                selected_parts: initialSelectedParts
            });

            setModalType('create-indent');
        } catch (error) {
            console.error("Error fetching indent suggestions:", error);
            alert(getErrorMessage(error, "Failed to load indent suggestions. Please try again."));
        } finally {
            setIsCreatingIndent(false);
        }
    };

    const handleCreateIndent = async (e) => {
        e.preventDefault();
        
        if (!indentFormData.supplier_id) {
            alert("Please select a supplier.");
            return;
        }

        const selectedParts = Object.entries(indentFormData.selected_parts).filter(([_, qty]) => qty > 0);
        if (selectedParts.length === 0) {
            alert("Please select at least one spare part.");
            return;
        }

        try {
            setIsCreatingIndent(true);

            // 1. Create indent
            const indentResponse = await api.post('/api/v1/indents', {
                job_id: job.id,
                supplier_id: parseInt(indentFormData.supplier_id),
                notes: indentFormData.notes || null
            });

            const indentId = indentResponse.data.id;

            // 2. Add spare parts to indent
            for (const [sparePartId, quantity] of selectedParts) {
                await api.post(`/api/v1/indents/${indentId}/parts`, {
                    spare_part_id: parseInt(sparePartId),
                    quantity: parseInt(quantity)
                });
            }

            // 3. Success!
            alert(`Indent ${indentResponse.data.serial_number} created successfully!`);
            
            // Refresh indents list
            const indentsResponse = await api.get(`/api/v1/jobs/${job.id}`);
            if (indentsResponse.data.indents) {
                setIndents(indentsResponse.data.indents);
            }

            closeModal();
        } catch (error) {
            console.error("Error creating indent:", error);
            alert(getErrorMessage(error, "Failed to create indent. Please try again."));
        } finally {
            setIsCreatingIndent(false);
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
                                Created on {new Date(job.created_at).toLocaleDateString('en-IN')}
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
                                        alert(getErrorMessage(err, "Failed to update status"));
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
                        {currentUser && (currentUser.is_admin || currentUser.is_manager) && (
                            <button
                                onClick={handleOpenAuditModal}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm font-medium text-sm"
                            >
                                <History size={16} />
                                <span className="hidden sm:inline">View History</span>
                                <span className="sm:hidden">History</span>
                            </button>
                        )}
                        <button
                            onClick={openEditModal}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-medium text-sm"
                        >
                            <Pencil size={16} />
                            <span>Edit</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExportingPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-green-600 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            <FileText size={16} />
                            <span className="hidden sm:inline">{isExportingPDF ? 'Exporting...' : 'Export PDF'}</span>
                            <span className="sm:hidden">PDF</span>
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
                                        alert(getErrorMessage(err, "Failed to update status"));
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                            <div className="space-y-3">
                                {/* Base Costs */}
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-sm text-gray-600">Parts Cost</span>
                                        <span className="font-medium text-gray-900">₹{job.estimated_parts_cost || '0.00'}</span>
                                    </div>
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-sm text-gray-600">Labour Cost</span>
                                        <span className="font-medium text-gray-900">₹{job.estimated_labour_cost || '0.00'}</span>
                                    </div>
                                </div>

                                {/* Additional Charges */}
                                {job.additional_charge && parseFloat(job.additional_charge) > 0 && (
                                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-green-700">Additional Charges</span>
                                                {job.additional_charge_note && (
                                                    <p className="text-xs text-green-600 mt-0.5">{job.additional_charge_note}</p>
                                                )}
                                            </div>
                                            <span className="font-medium text-green-700">+₹{job.additional_charge}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Deductions */}
                                {job.deduction && parseFloat(job.deduction) > 0 && (
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-red-700">Deductions</span>
                                                {job.deduction_note && (
                                                    <p className="text-xs text-red-600 mt-0.5">{job.deduction_note}</p>
                                                )}
                                            </div>
                                            <span className="font-medium text-red-700">-₹{job.deduction}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-blue-900">Estimated Total</span>
                                        <span className="text-lg font-bold text-blue-700">₹{job.estimated_cost || '0.00'}</span>
                                    </div>
                                </div>

                                {/* Actual Cost if different */}
                                {job.actual_cost && parseFloat(job.actual_cost) > 0 && (
                                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 mt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold text-purple-900">Actual Cost</span>
                                            <span className="text-lg font-bold text-purple-700">₹{job.actual_cost}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Delivery Information */}
                                <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
                                    <div className="flex justify-between py-2">
                                        <span className="text-sm text-gray-600">Delivery Date</span>
                                        <span className="font-medium text-gray-900">
                                            {job.estimated_delivery_date ? new Date(job.estimated_delivery_date).toLocaleDateString('en-IN') : '-'}
                                        </span>
                                    </div>
                                    {job.original_estimated_delivery_date && job.original_estimated_delivery_date !== job.estimated_delivery_date && (
                                        <div className="flex justify-between py-2">
                                            <span className="text-sm text-gray-500">Original Date</span>
                                            <span className="font-medium text-gray-500 line-through text-sm">
                                                {new Date(job.original_estimated_delivery_date).toLocaleDateString('en-IN')}
                                            </span>
                                        </div>
                                    )}
                                    {job.delay_reason && (
                                        <div className="py-2 mt-2">
                                            <span className="text-xs text-gray-500 block mb-1">Delay Reason</span>
                                            <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                {job.delay_reason}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Show spare parts delivery estimate if available */}
                                    {(() => {
                                        const maxDelivery = Math.max(
                                            0,
                                            ...complaints
                                                .filter(c => c.indent_required && c.spare_part?.estimated_delivery_days)
                                                .map(c => c.spare_part.estimated_delivery_days)
                                        );
                                        if (maxDelivery > 0) {
                                            return (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center gap-2">
                                                    <Clock size={14} className="text-blue-600" />
                                                    <span className="text-xs font-medium text-blue-900">
                                                        Spare parts delivery: {maxDelivery} days
                                                    </span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
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
                                        {watch.date_of_purchase ? new Date(watch.date_of_purchase).toLocaleDateString('en-IN') : '-'}
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
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">
                                                        {item.complaint_node?.parent_label 
                                                            ? `${item.complaint_node.parent_label} - ${item.complaint_node.label}`
                                                            : item.complaint_node?.label || `Complaint ID: ${item.complaint_node_id}`
                                                        }
                                                    </p>
                                                    {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                                                    
                                                    {/* Indent Status Badge */}
                                                    {item.indent_required && (
                                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                                            <Package size={12} />
                                                            <span>
                                                                Part Required: {item.spare_part?.part_name || 'Not selected'}
                                                            </span>
                                                            {item.spare_part?.estimated_delivery_days && (
                                                                <span className="text-orange-600">
                                                                    ({item.spare_part.estimated_delivery_days} days)
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
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
                                                        {item.condition_node?.parent_label 
                                                            ? `${item.condition_node.parent_label} - ${item.condition_node.label}`
                                                            : item.condition_node?.label || `Condition ID: ${item.condition_node_id}`
                                                        }
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
                                                <span>{attachment.uploaded_at ? new Date(attachment.uploaded_at).toLocaleDateString('en-IN') : '-'}</span>
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
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Indents & Parts</h2>
                        {(() => {
                            const partsRequired = complaints.filter(c => c.indent_required).length;
                            if (partsRequired > 0) {
                                return (
                                    <button
                                        onClick={handleOpenIndentModal}
                                        disabled={isCreatingIndent}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Package size={16} />
                                        {isCreatingIndent ? 'Loading...' : `Create Indent (${partsRequired} part${partsRequired > 1 ? 's' : ''})`}
                                    </button>
                                );
                            }
                            return null;
                        })()}
                    </div>
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
                                                        {indent.created_at ? new Date(indent.created_at).toLocaleDateString('en-IN') : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                                                    <p className="font-medium text-gray-900">
                                                        {indent.updated_at ? new Date(indent.updated_at).toLocaleDateString('en-IN') : '-'}
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
                                        <div className="space-y-6">
                                            {/* Base Costs */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Base Costs</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Parts Cost</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                            <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                value={formData.estimated_parts_cost || ''} 
                                                                onChange={e => {
                                                                    const newFormData = { ...formData, estimated_parts_cost: e.target.value };
                                                                    const total = (
                                                                        (parseFloat(newFormData.estimated_parts_cost) || 0) +
                                                                        (parseFloat(newFormData.estimated_labour_cost) || 0) +
                                                                        (parseFloat(newFormData.additional_charge) || 0) -
                                                                        (parseFloat(newFormData.deduction) || 0)
                                                                    );
                                                                    newFormData.estimated_cost = total;
                                                                    setFormData(newFormData);
                                                                }} 
                                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200" 
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Labour Cost</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                            <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                value={formData.estimated_labour_cost || ''} 
                                                                onChange={e => {
                                                                    const newFormData = { ...formData, estimated_labour_cost: e.target.value };
                                                                    const total = (
                                                                        (parseFloat(newFormData.estimated_parts_cost) || 0) +
                                                                        (parseFloat(newFormData.estimated_labour_cost) || 0) +
                                                                        (parseFloat(newFormData.additional_charge) || 0) -
                                                                        (parseFloat(newFormData.deduction) || 0)
                                                                    );
                                                                    newFormData.estimated_cost = total;
                                                                    setFormData(newFormData);
                                                                }} 
                                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-200" 
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Additional Charges */}
                                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                                <h4 className="text-sm font-semibold text-green-900 mb-3">Additional Charges</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-green-700 mb-1">Amount</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                            <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                value={formData.additional_charge || ''} 
                                                                onChange={e => {
                                                                    const newFormData = { ...formData, additional_charge: e.target.value };
                                                                    const total = (
                                                                        (parseFloat(newFormData.estimated_parts_cost) || 0) +
                                                                        (parseFloat(newFormData.estimated_labour_cost) || 0) +
                                                                        (parseFloat(newFormData.additional_charge) || 0) -
                                                                        (parseFloat(newFormData.deduction) || 0)
                                                                    );
                                                                    newFormData.estimated_cost = total;
                                                                    setFormData(newFormData);
                                                                }} 
                                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-green-200 bg-white" 
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                                        <input 
                                                            type="text" 
                                                            value={formData.additional_charge_note || ''} 
                                                            onChange={e => setFormData({ ...formData, additional_charge_note: e.target.value })} 
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white" 
                                                            placeholder="e.g., Express service"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deductions */}
                                            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                                                <h4 className="text-sm font-semibold text-red-900 mb-3">Deductions</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-red-700 mb-1">Amount</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                            <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                value={formData.deduction || ''} 
                                                                onChange={e => {
                                                                    const newFormData = { ...formData, deduction: e.target.value };
                                                                    const total = (
                                                                        (parseFloat(newFormData.estimated_parts_cost) || 0) +
                                                                        (parseFloat(newFormData.estimated_labour_cost) || 0) +
                                                                        (parseFloat(newFormData.additional_charge) || 0) -
                                                                        (parseFloat(newFormData.deduction) || 0)
                                                                    );
                                                                    newFormData.estimated_cost = total;
                                                                    setFormData(newFormData);
                                                                }} 
                                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-red-200 bg-white" 
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                                        <input 
                                                            type="text" 
                                                            value={formData.deduction_note || ''} 
                                                            onChange={e => setFormData({ ...formData, deduction_note: e.target.value })} 
                                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white" 
                                                            placeholder="e.g., Customer discount"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Total Display */}
                                            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-semibold text-blue-900">Estimated Total</span>
                                                    <span className="text-xl font-bold text-blue-700">
                                                        ₹{(
                                                            (parseFloat(formData.estimated_parts_cost) || 0) +
                                                            (parseFloat(formData.estimated_labour_cost) || 0) +
                                                            (parseFloat(formData.additional_charge) || 0) -
                                                            (parseFloat(formData.deduction) || 0)
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actual Cost */}
                                            <div>
                                                <label className="block text-sm font-medium text-purple-700 mb-1">Actual Cost (Final Bill)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        value={formData.actual_cost || ''} 
                                                        onChange={e => setFormData({ ...formData, actual_cost: e.target.value })} 
                                                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-purple-200 bg-purple-50" 
                                                        placeholder="Enter final billed amount"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">This is the actual amount charged to customer (can differ from estimate)</p>
                                            </div>

                                            {/* Delivery and Notes */}
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Delivery Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={formData.estimated_delivery_date?.split('T')[0]} 
                                                        onChange={e => setFormData({ ...formData, estimated_delivery_date: e.target.value })} 
                                                        className="w-full px-3 py-2 rounded-lg border border-gray-200" 
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Job Notes</label>
                                                <textarea 
                                                    value={formData.notes || ''} 
                                                    onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-200" 
                                                    rows="3"
                                                    placeholder="Additional notes about the job..."
                                                ></textarea>
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

                                                    {/* Spare Parts Metadata for Selected Complaints */}
                                                    {formData.selected_complaint_ids && formData.selected_complaint_ids.length > 0 && (
                                                        <div className="mt-4 space-y-3">
                                                            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                                <Package className="w-4 h-4 text-blue-600" />
                                                                Spare Parts Requirements
                                                            </h4>
                                                            {formData.selected_complaint_ids.map(complaintId => {
                                                                const findNode = (nodes, targetId) => {
                                                                    for (const node of nodes) {
                                                                        if (node.id === targetId) return node;
                                                                        if (node.children) {
                                                                            const found = findNode(node.children, targetId);
                                                                            if (found) return found;
                                                                        }
                                                                    }
                                                                    return null;
                                                                };
                                                                
                                                                const complaintNode = findNode(availableComplaints, complaintId);
                                                                const metadata = formData.complaint_spare_parts?.[complaintId] || {};
                                                                
                                                                if (!complaintNode) return null;

                                                                return (
                                                                    <div key={complaintId} className="bg-white rounded-lg border border-gray-200 p-3">
                                                                        <h5 className="font-medium text-gray-900 text-sm mb-2">
                                                                            {complaintNode.parent_label ? `${complaintNode.parent_label} - ` : ''}
                                                                            {complaintNode.label}
                                                                        </h5>
                                                                        
                                                                        <div className="space-y-2">
                                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={metadata.indent_required || false}
                                                                                    onChange={(e) => handleComplaintSparePartChange(complaintId, 'indent_required', e.target.checked)}
                                                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                                                                />
                                                                                <span className="text-sm text-gray-700">Requires spare part</span>
                                                                            </label>

                                                                            {metadata.indent_required && (
                                                                                <select
                                                                                    value={metadata.spare_part_id || ''}
                                                                                    onChange={(e) => handleComplaintSparePartChange(complaintId, 'spare_part_id', e.target.value ? parseInt(e.target.value) : null)}
                                                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 bg-white"
                                                                                >
                                                                                    <option value="">Select spare part...</option>
                                                                                    {spareParts.map(part => (
                                                                                        <option key={part.id} value={part.id}>
                                                                                            {part.part_name}
                                                                                            {part.estimated_delivery_days ? ` - ${part.estimated_delivery_days} days` : ''}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
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

                            {modalType === 'create-indent' && indentSuggestions && (
                                <form onSubmit={handleCreateIndent} className="space-y-4">
                                    {/* Suggested Parts */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Required Spare Parts</h4>
                                        <div className="space-y-3 max-h-60 overflow-y-auto">
                                            {indentSuggestions.suggestions.map(suggestion => (
                                                <div key={suggestion.spare_part.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={(indentFormData.selected_parts[suggestion.spare_part.id] || 0) > 0}
                                                            onChange={(e) => {
                                                                setIndentFormData(prev => ({
                                                                    ...prev,
                                                                    selected_parts: {
                                                                        ...prev.selected_parts,
                                                                        [suggestion.spare_part.id]: e.target.checked ? 1 : 0
                                                                    }
                                                                }));
                                                            }}
                                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{suggestion.spare_part.part_name}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Needed for: {suggestion.complaint_labels.join(', ')}
                                                            </p>
                                                            {suggestion.max_estimated_delivery_days && (
                                                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    Delivery: {suggestion.max_estimated_delivery_days} days
                                                                </p>
                                                            )}
                                                        </div>
                                                        {(indentFormData.selected_parts[suggestion.spare_part.id] || 0) > 0 && (
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={indentFormData.selected_parts[suggestion.spare_part.id] || 1}
                                                                onChange={(e) => {
                                                                    setIndentFormData(prev => ({
                                                                        ...prev,
                                                                        selected_parts: {
                                                                            ...prev.selected_parts,
                                                                            [suggestion.spare_part.id]: parseInt(e.target.value) || 1
                                                                        }
                                                                    }));
                                                                }}
                                                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                                                placeholder="Qty"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Delivery Estimate */}
                                    {indentSuggestions.max_estimated_delivery_days && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                                            <Clock size={16} className="text-blue-600" />
                                            <span className="text-sm font-medium text-blue-900">
                                                Maximum estimated delivery: {indentSuggestions.max_estimated_delivery_days} days
                                            </span>
                                        </div>
                                    )}

                                    {/* Supplier Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                                        <select
                                            required
                                            value={indentFormData.supplier_id}
                                            onChange={(e) => setIndentFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-100 bg-white"
                                        >
                                            <option value="">Select a supplier...</option>
                                            {suppliers.map(supplier => (
                                                <option key={supplier.id} value={supplier.id}>
                                                    {supplier.name}
                                                    {supplier.contact_number && ` - ${supplier.contact_number}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                        <textarea
                                            value={indentFormData.notes}
                                            onChange={(e) => setIndentFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200"
                                            rows="3"
                                            placeholder="Additional notes for this indent..."
                                        ></textarea>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                        <button 
                                            type="button" 
                                            onClick={closeModal} 
                                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                            disabled={isCreatingIndent}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            disabled={isCreatingIndent}
                                        >
                                            {isCreatingIndent ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                'Create Indent Order'
                                            )}
                                        </button>
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
                                                {selectedImage.uploaded_at ? new Date(selectedImage.uploaded_at).toLocaleDateString('en-IN') : '-'}
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
            
            {/* Audit History Modal */}
            {showAuditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseAuditModal}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <History size={20} />
                                Job History
                            </h3>
                            <button onClick={handleCloseAuditModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden min-h-0">
                            <AuditTimeline
                                events={auditEvents}
                                loading={auditLoading}
                                error={auditError}
                                currentPage={auditPage}
                                totalPages={auditTotalPages}
                                onPageChange={handleAuditPageChange}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetailsPage;
