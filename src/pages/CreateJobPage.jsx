import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { User, Watch, ClipboardList, Camera } from 'lucide-react';
import CustomerStep from '../components/jobs/create/CustomerStep';
import WatchStep from '../components/jobs/create/WatchStep';
import IssuesStep from '../components/jobs/create/IssuesStep';
import ImagesStep from '../components/jobs/create/ImagesStep';
import StepIndicator from '../components/jobs/create/StepIndicator';
import WatchSelectionModal from '../components/jobs/create/WatchSelectionModal';
import CustomerAutofillPrompt from '../components/jobs/create/CustomerAutofillPrompt';
import { getErrorMessage } from '../utils/errorUtils';

const steps = [
    { id: 1, title: 'Customer', icon: User },
    { id: 2, title: 'Watch Details', icon: Watch },
    { id: 3, title: 'Issues', icon: ClipboardList },
    { id: 4, title: 'Images', icon: Camera },
];

const CreateJobPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [brands, setBrands] = useState([]);
    const [conditionNodes, setConditionNodes] = useState([]);
    const [complaintNodes, setComplaintNodes] = useState([]);
    const [spareParts, setSpareParts] = useState([]);

    // New state for customer lookup and watch selection

    const [existingWatches, setExistingWatches] = useState([]);
    const [showWatchModal, setShowWatchModal] = useState(false);
    const [allCustomers, setAllCustomers] = useState([]);

    // State for autofill prompt
    const [pendingCustomer, setPendingCustomer] = useState(null);

    // Cost Breakdown State
    const [costBreakdown, setCostBreakdown] = useState(null);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const response = await api.get('/api/v1/brands/all');
                // This endpoint returns a direct array, perfect for dropdowns
                if (response.data && Array.isArray(response.data)) {
                    setBrands(response.data);
                }
            } catch (error) {
                console.warn("Failed to fetch brands, using default list:", error);
            }
        };
        fetchBrands();
    }, []);

    useEffect(() => {
        const fetchConditionNodes = async () => {
            try {
                const response = await api.get('/api/v1/conditions/nodes');
                if (response.data) {
                    setConditionNodes(response.data);
                }
            } catch (error) {
                console.warn("Failed to fetch condition nodes:", error);
            }
        };
        fetchConditionNodes();
    }, []);

    useEffect(() => {
        const fetchComplaintNodes = async () => {
            try {
                const response = await api.get('/api/v1/complaints/nodes');
                if (response.data) {
                    setComplaintNodes(response.data);
                }
            } catch (error) {
                console.warn("Failed to fetch complaint nodes:", error);
            }
        };
        fetchComplaintNodes();
    }, []);

    useEffect(() => {
        const fetchSpareParts = async () => {
            try {
                const response = await api.get('/api/v1/spare-parts/all');
                if (response.data) {
                    setSpareParts(response.data);
                }
            } catch (error) {
                console.warn("Failed to fetch spare parts:", error);
            }
        };
        fetchSpareParts();
    }, []);

    useEffect(() => {
        const fetchAllCustomers = async () => {
            try {
                let allItems = [];
                let page = 1;
                let hasMore = true;

                while (hasMore) {
                    const response = await api.get(`/api/v1/customers?page=${page}&page_size=100`);
                    const items = response.data.items || response.data || [];

                    if (items.length > 0) {
                        allItems = [...allItems, ...items];
                        // If we got fewer items than page_size, we've reached the end
                        if (items.length < 100) {
                            hasMore = false;
                        } else {
                            page++;
                        }
                    } else {
                        hasMore = false;
                    }

                    // Safety break to prevent infinite loops if API behaves unexpectedly
                    if (page > 20) hasMore = false; // Cap at 2000 customers for now to prevent browser freeze
                }

                setAllCustomers(allItems);
            } catch (error) {
                console.warn("Failed to fetch customers:", error);
            }
        };
        fetchAllCustomers();
    }, []);

    const [formData, setFormData] = useState({
        customer: {
            id: null, // Track ID if existing customer
            name: '',
            contact_number: '',
            email: '',
            address: '',
            city: '',
            state: '',
            country: '',
            postal_code: '',
            date_of_birth: '',
            gender: ''
        },
        watch: {
            brand_id: '',
            model_number: '',
            watch_serial_number: '',
            date_of_purchase: '',
            ucp_rate: '',
            other_remarks: '',
            accessories: []
        },
        issues: {
            reported_issues: [],
            condition_node_ids: [],
            complaint_node_ids: [],
            complaint_spare_parts: {}, // { complaint_node_id: { indent_required: bool, spare_part_id: number } }
            other_issue: '',
            spare_parts: [],
            estimated_cost: '',
            estimated_parts_cost: '',
            estimated_labour_cost: '',
            additional_charge: '',
            additional_charge_note: '',
            deduction: '',
            deduction_note: '',
            estimated_delivery: ''
        },
        images: []
    });

    const [imagePreviews, setImagePreviews] = useState([]);

    const handleCustomerLookup = async (phoneNumber) => {
        if (!phoneNumber || phoneNumber.length < 3) return;


        try {
            // Local lookup from allCustomers state
            // Normalize phone numbers for comparison if needed (remove spaces, dashes, etc.)
            const normalizedInput = phoneNumber.replace(/\D/g, '');

            const customer = allCustomers.find(c => {
                const customerPhone = c.contact_number ? c.contact_number.replace(/\D/g, '') : '';
                return customerPhone.includes(normalizedInput) || c.contact_number === phoneNumber;
            });

            if (customer) {
                // Don't autofill yet, ask user
                setPendingCustomer(customer);
            }
        } catch (error) {
            console.error("Error searching customer:", error);
        }
    };

    const handleConfirmAutofill = async () => {
        if (!pendingCustomer) return;

        let customerData = pendingCustomer;

        // Fetch full customer details to ensure we have all fields
        try {
            const response = await api.get(`/api/v1/customers/${pendingCustomer.id}`);
            if (response.data) {
                customerData = response.data;
            }
        } catch (error) {
            console.warn("Failed to fetch full customer details, using cached data:", error);
        }

        // Autofill customer data
        setFormData(prev => ({
            ...prev,
            customer: {
                ...prev.customer,
                id: customerData.id,
                name: customerData.name || '',
                contact_number: customerData.contact_number || prev.customer.contact_number,
                email: customerData.email || '',
                address: customerData.address || '',
                city: customerData.city || '',
                state: customerData.state || '',
                country: customerData.country || '',
                postal_code: customerData.postal_code || '',
                date_of_birth: customerData.date_of_birth ? customerData.date_of_birth.split('T')[0] : '',
                gender: customerData.gender || ''
            }
        }));

        setPendingCustomer(null); // Clear prompt

        // Fetch customer's watches via jobs
        try {
            // 1. Get all jobs for this customer
            const jobsResponse = await api.get(`/api/v1/jobs?customer_id=${customerData.id}`);
            const jobs = jobsResponse.data.items || jobsResponse.data || [];

            if (jobs.length > 0) {
                const watches = [];
                // 2. For each job, get the associated watch
                for (const job of jobs) {
                    try {
                        const watchResponse = await api.get(`/api/v1/watches/job/${job.id}`);
                        if (watchResponse.data) {
                            watches.push(watchResponse.data);
                        }
                    } catch (err) {
                        // Ignore if a job doesn't have a watch or fails
                        console.warn(`Could not fetch watch for job ${job.id}`, err);
                    }
                }

                if (watches.length > 0) {
                    setExistingWatches(watches);
                    setShowWatchModal(true);
                }
            }
        } catch (err) {
            console.warn("Could not fetch existing watches:", err);
        }
    };

    const handleCancelAutofill = () => {
        setPendingCustomer(null);
    };

    const handleWatchSelection = (selectedWatch) => {
        setFormData(prev => ({
            ...prev,
            watch: {
                ...prev.watch,
                brand_id: selectedWatch.brand_id || '',
                model_number: selectedWatch.model_number || '',
                watch_serial_number: selectedWatch.watch_serial_number || '',
                date_of_purchase: selectedWatch.date_of_purchase ? selectedWatch.date_of_purchase.split('T')[0] : '',
                ucp_rate: selectedWatch.ucp_rate || '',
                other_remarks: selectedWatch.other_remarks || ''
            }
        }));
        setShowWatchModal(false);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Update formData
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...files]
        }));

        // Generate previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const handleRemoveImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));

        setImagePreviews(prev => {
            // Revoke URL to prevent memory leaks
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            customer: {
                ...prev.customer,
                [name]: value
            }
        }));
    };

    const handleWatchChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            watch: {
                ...prev.watch,
                [name]: value
            }
        }));
    };

    const handleIssueChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            issues: {
                ...prev.issues,
                [name]: value
            }
        }));
    };

    const handleConditionToggle = (nodeId) => {
        setFormData(prev => {
            const currentIds = prev.issues.condition_node_ids || [];
            const newIds = currentIds.includes(nodeId)
                ? currentIds.filter(id => id !== nodeId)
                : [...currentIds, nodeId];

            return {
                ...prev,
                issues: {
                    ...prev.issues,
                    condition_node_ids: newIds
                }
            };
        });
    };

    const handleComplaintToggle = (nodeId) => {
        setFormData(prev => {
            const currentIds = prev.issues.complaint_node_ids || [];
            const isRemoving = currentIds.includes(nodeId);
            const newIds = isRemoving
                ? currentIds.filter(id => id !== nodeId)
                : [...currentIds, nodeId];

            // If removing complaint, also remove its spare parts metadata
            const newComplaintSpareParts = { ...prev.issues.complaint_spare_parts };
            if (isRemoving) {
                delete newComplaintSpareParts[nodeId];
            }

            return {
                ...prev,
                issues: {
                    ...prev.issues,
                    complaint_node_ids: newIds,
                    complaint_spare_parts: newComplaintSpareParts
                }
            };
        });
    };

    const handleComplaintSparePartChange = (complaintNodeId, field, value) => {
        setFormData(prev => ({
            ...prev,
            issues: {
                ...prev.issues,
                complaint_spare_parts: {
                    ...prev.issues.complaint_spare_parts,
                    [complaintNodeId]: {
                        ...(prev.issues.complaint_spare_parts[complaintNodeId] || {}),
                        [field]: value
                    }
                }
            }
        }));
    };

    // State to track created resources

    const [createdJobId, setCreatedJobId] = useState(null);
    const [createdWatchId, setCreatedWatchId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCalculateCost = async () => {
        if (!createdJobId || !createdWatchId) {
            alert("Job or Watch not created yet. Please complete previous steps.");
            return;
        }
        try {
            setIsLoading(true);

            // 1. Clear existing issues to ensure backend matches frontend selection
            try {
                await api.delete(`/api/v1/complaints/watch-complaints/watch/${createdWatchId}/all`);
                await api.delete(`/api/v1/conditions/watch-conditions/watch/${createdWatchId}/all`);
            } catch (e) {
                console.warn("Failed to clear existing issues:", e);
            }

            // 2. Attach Complaints (with spare parts metadata)
            if (formData.issues.complaint_node_ids.length > 0) {
                // Check if we have any spare parts metadata
                const hasSparePartsMetadata = Object.keys(formData.issues.complaint_spare_parts).length > 0;
                
                if (hasSparePartsMetadata) {
                    // Create complaints individually to include spare parts metadata
                    for (const nodeId of formData.issues.complaint_node_ids) {
                        const metadata = formData.issues.complaint_spare_parts[nodeId] || {};
                        await api.post('/api/v1/complaints/watch-complaints', {
                            watch_id: createdWatchId,
                            complaint_node_id: nodeId,
                            notes: "Customer reported",
                            indent_required: metadata.indent_required || false,
                            spare_part_id: metadata.spare_part_id || null
                        });
                    }
                } else {
                    // Use batch endpoint if no metadata
                    await api.post('/api/v1/complaints/watch-complaints/batch', {
                        watch_id: createdWatchId,
                        complaint_node_ids: formData.issues.complaint_node_ids,
                        notes: "Customer reported"
                    });
                }
            }

            // 3. Attach Conditions
            if (formData.issues.condition_node_ids.length > 0) {
                await api.post('/api/v1/conditions/watch-conditions/batch', {
                    watch_id: createdWatchId,
                    condition_node_ids: formData.issues.condition_node_ids,
                    notes: "Initial conditions"
                });
            }

            // 4. Recalculate Pricing
            const response = await api.post(`/api/v1/jobs/${createdJobId}/recalculate-pricing`, {
                apply_to_job: true
            });

            // The response structure is { estimate: { ... }, applied: true, message: ... }
            const estimateData = response.data.estimate;
            setCostBreakdown(estimateData);

            if (estimateData && estimateData.estimated_total) {
                setFormData(prev => ({
                    ...prev,
                    issues: {
                        ...prev.issues,
                        estimated_parts_cost: parseFloat(estimateData.total_parts_cost) || 0,
                        estimated_labour_cost: parseFloat(estimateData.total_labour_cost) || 0,
                        // Auto-set delivery to 30 days from now if not already set
                        estimated_delivery: prev.issues.estimated_delivery || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }
                }));
            }

        } catch (error) {
            console.error("Calculation failed:", error);
            alert(getErrorMessage(error, "Failed to calculate cost. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep1Next = async () => {
        try {
            // Validate Customer Data (Basic validation)
            if (!formData.customer.name || !formData.customer.contact_number) {
                alert("Please fill in Name and Contact Number");
                return;
            }

            setIsLoading(true);
            let customerId = formData.customer.id;

            // 1. Create or Update Customer
            if (!customerId) {
                // Create new customer
                const customerResponse = await api.post('/api/v1/customers', {
                    name: formData.customer.name,
                    contact_number: formData.customer.contact_number,
                    email: formData.customer.email,
                    address: formData.customer.address,
                    city: formData.customer.city,
                    state: formData.customer.state,
                    country: formData.customer.country,
                    postal_code: formData.customer.postal_code,
                    date_of_birth: formData.customer.date_of_birth,
                    gender: formData.customer.gender
                });
                customerId = customerResponse.data.id;
            } else {
                // Update existing customer (if needed, or just use ID)
                // We update to ensure latest details are saved
                await api.patch(`/api/v1/customers/${customerId}`, {
                    name: formData.customer.name,
                    contact_number: formData.customer.contact_number,
                    email: formData.customer.email,
                    address: formData.customer.address,
                    city: formData.customer.city,
                    state: formData.customer.state,
                    country: formData.customer.country,
                    postal_code: formData.customer.postal_code,
                    date_of_birth: formData.customer.date_of_birth,
                    gender: formData.customer.gender
                });
            }


            // 2. Create Job (if not already created)
            let jobId = createdJobId;
            if (!jobId) {
                const jobResponse = await api.post('/api/v1/jobs', {
                    customer_id: customerId,
                    estimated_delivery_date: null, // Will be updated in Step 3
                    notes: '' // Will be updated in Step 3
                });
                jobId = jobResponse.data.id;
                setCreatedJobId(jobId);
            }

            // Move to next step
            setCurrentStep(2);

        } catch (error) {
            console.error("Error in Step 1:", error);
            alert(getErrorMessage(error, "Failed to save customer or create job. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep2Next = async () => {
        try {
            // Validate Watch Data
            if (!formData.watch.brand_id || !formData.watch.model_number) {
                alert("Please select Brand and enter Model Number");
                return;
            }

            if (!createdJobId) {
                alert("Job ID is missing. Please go back and try again.");
                return;
            }

            setIsLoading(true);

            // 3. Create Watch (if not already created)
            let watchId = createdWatchId;
            if (!watchId) {
                const watchResponse = await api.post('/api/v1/watches', {
                    job_id: createdJobId,
                    brand_id: parseInt(formData.watch.brand_id),
                    model_number: formData.watch.model_number,
                    watch_serial_number: formData.watch.watch_serial_number,
                    date_of_purchase: formData.watch.date_of_purchase,
                    ucp_rate: parseFloat(formData.watch.ucp_rate) || 0,
                    other_remarks: formData.watch.other_remarks
                });
                watchId = watchResponse.data.id;
                setCreatedWatchId(watchId);
            }

            // Move to next step
            setCurrentStep(3);

        } catch (error) {
            console.error("Error in Step 2:", error);
            alert(getErrorMessage(error, "Failed to save watch details. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep3Next = async () => {
        try {
            if (!createdWatchId || !createdJobId) {
                alert("Missing Watch or Job ID. Please go back.");
                return;
            }

            setIsLoading(true);

            // Clear existing issues to prevent duplicates (in case user clicked Calculate first)
            try {
                await api.delete(`/api/v1/complaints/watch-complaints/watch/${createdWatchId}/all`);
                await api.delete(`/api/v1/conditions/watch-conditions/watch/${createdWatchId}/all`);
            } catch (e) {
                console.warn("Failed to clear existing issues:", e);
            }

            // 4. Attach Complaints (with spare parts metadata)
            if (formData.issues.complaint_node_ids.length > 0) {
                // Check if we have any spare parts metadata
                const hasSparePartsMetadata = Object.keys(formData.issues.complaint_spare_parts).length > 0;
                
                if (hasSparePartsMetadata) {
                    // Create complaints individually to include spare parts metadata
                    for (const nodeId of formData.issues.complaint_node_ids) {
                        const metadata = formData.issues.complaint_spare_parts[nodeId] || {};
                        await api.post('/api/v1/complaints/watch-complaints', {
                            watch_id: createdWatchId,
                            complaint_node_id: nodeId,
                            notes: "Customer reported",
                            indent_required: metadata.indent_required || false,
                            spare_part_id: metadata.spare_part_id || null
                        });
                    }
                } else {
                    // Use batch endpoint if no metadata
                    await api.post('/api/v1/complaints/watch-complaints/batch', {
                        watch_id: createdWatchId,
                        complaint_node_ids: formData.issues.complaint_node_ids,
                        notes: "Customer reported"
                    });
                }
            }

            // 5. Attach Conditions (Batch)
            if (formData.issues.condition_node_ids.length > 0) {
                await api.post('/api/v1/conditions/watch-conditions/batch', {
                    watch_id: createdWatchId,
                    condition_node_ids: formData.issues.condition_node_ids,
                    notes: "Initial conditions"
                });
            }

            // 6. Update Job with Estimated Delivery, Cost, and Notes
            const finalEstimatedCost = (
                (parseFloat(formData.issues.estimated_parts_cost) || 0) +
                (parseFloat(formData.issues.estimated_labour_cost) || 0) +
                (parseFloat(formData.issues.additional_charge) || 0) -
                (parseFloat(formData.issues.deduction) || 0)
            );

            await api.patch(`/api/v1/jobs/${createdJobId}`, {
                status: 'booked', // Keep status as booked
                estimated_delivery_date: formData.issues.estimated_delivery,
                notes: formData.issues.other_issue,
                estimated_cost: finalEstimatedCost,
                estimated_parts_cost: parseFloat(formData.issues.estimated_parts_cost) || 0,
                estimated_labour_cost: parseFloat(formData.issues.estimated_labour_cost) || 0,
                additional_charge: parseFloat(formData.issues.additional_charge) || null,
                additional_charge_note: formData.issues.additional_charge_note || null,
                deduction: parseFloat(formData.issues.deduction) || null,
                deduction_note: formData.issues.deduction_note || null
            });

            // Move to next step
            setCurrentStep(4);

        } catch (error) {
            console.error("Error in Step 3:", error);
            alert(getErrorMessage(error, "Failed to save issues and conditions. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        try {
            if (!createdWatchId) {
                alert("Watch ID missing.");
                return;
            }

            setIsLoading(true);

            // 7. Upload Images
            if (formData.images.length > 0) {
                for (const image of formData.images) {
                    const formDataImage = new FormData();
                    formDataImage.append('file', image);
                    await api.post(`/api/v1/watches/${createdWatchId}/attachments`, formDataImage, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
            }

            // Navigate to dashboard or job details
            alert('Job Created Successfully!');
            navigate(`/jobs/${createdJobId}`);

        } catch (error) {
            console.error("Error in Final Step:", error);
            alert(getErrorMessage(error, 'Failed to upload images or finish job. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
                <p className="text-gray-500 mt-1">Create a new service job card</p>
            </div>

            {/* Stepper */}
            <StepIndicator steps={steps} currentStep={currentStep} />

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[400px] p-8">
                {currentStep === 1 && (
                    <CustomerStep
                        formData={formData}
                        handleChange={handleCustomerChange}
                        onPhoneBlur={handleCustomerLookup}
                    />
                )}
                {currentStep === 2 && (
                    <WatchStep
                        formData={formData}
                        handleChange={handleWatchChange}
                        brands={brands}
                    />
                )}
                {currentStep === 3 && (
                    <IssuesStep
                        formData={formData}
                        handleChange={handleIssueChange}
                        conditionNodes={conditionNodes}
                        complaintNodes={complaintNodes}
                        spareParts={spareParts}
                        handleConditionToggle={handleConditionToggle}
                        handleComplaintToggle={handleComplaintToggle}
                        handleComplaintSparePartChange={handleComplaintSparePartChange}
                        onCalculateCost={handleCalculateCost}
                        costBreakdown={costBreakdown}
                        isCalculating={isLoading}
                    />
                )}
                {currentStep === 4 && (
                    <ImagesStep
                        imagePreviews={imagePreviews}
                        handleImageChange={handleImageChange}
                        handleRemoveImage={handleRemoveImage}
                    />
                )}

                <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                    <button
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        className={`
                            px-6 py-2.5 rounded-xl font-medium transition-colors
                            ${currentStep === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                        `}
                        disabled={currentStep === 1}
                    >
                        Back
                    </button>

                    {currentStep < steps.length ? (
                        <button
                            onClick={() => {
                                if (currentStep === 1) handleStep1Next();
                                if (currentStep === 2) handleStep2Next();
                                if (currentStep === 3) handleStep3Next();
                            }}
                            disabled={isLoading}
                            className={`px-6 py-2.5 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors shadow-lg shadow-gray-900/20 flex items-center gap-2 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Next Step'
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleFinalSubmit}
                            disabled={isLoading}
                            className={`px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20 font-medium flex items-center gap-2 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Finish & Create Job'
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Watch Selection Modal */}
            <WatchSelectionModal
                isOpen={showWatchModal}
                onClose={() => setShowWatchModal(false)}
                watches={existingWatches}
                onSelect={handleWatchSelection}
            />

            {/* Customer Autofill Prompt */}
            <CustomerAutofillPrompt
                customer={pendingCustomer}
                onConfirm={handleConfirmAutofill}
                onCancel={handleCancelAutofill}
            />
        </div>
    );
};

export default CreateJobPage;
