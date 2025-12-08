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

const steps = [
    { id: 1, title: 'Customer', icon: User },
    { id: 2, title: 'Watch Details', icon: Watch },
    { id: 3, title: 'Issues', icon: ClipboardList },
    { id: 4, title: 'Images', icon: Camera },
];

// Fallback brands if API fails
const DEFAULT_BRANDS = [
    { id: 1, name: 'Rolex' },
    { id: 2, name: 'Omega' },
    { id: 3, name: 'Tag Heuer' },
    { id: 4, name: 'Breitling' },
    { id: 5, name: 'Patek Philippe' },
    { id: 6, name: 'Audemars Piguet' },
    { id: 7, name: 'Cartier' },
    { id: 8, name: 'Seiko' },
    { id: 9, name: 'Casio' },
    { id: 10, name: 'Other' }
];

const CONDITION_NODES = [
    {
        id: 1,
        label: "Movement",
        code: "MOVEMENT",
        children: [
            { id: 10, label: "Not Working", code: "MV_NOT_WORKING", children: [] },
            { id: 11, label: "Running Slow", code: "MV_SLOW", children: [] },
            { id: 12, label: "Running Fast", code: "MV_FAST", children: [] }
        ]
    },
    {
        id: 2,
        label: "Case",
        code: "CASE",
        children: [
            { id: 20, label: "Scratched", code: "CS_SCRATCHED", children: [] },
            { id: 21, label: "Dented", code: "CS_DENTED", children: [] },
            { id: 22, label: "Polishing Required", code: "CS_POLISH", children: [] }
        ]
    },
    {
        id: 3,
        label: "Crystal / Glass",
        code: "CRYSTAL",
        children: [
            { id: 30, label: "Broken", code: "CR_BROKEN", children: [] },
            { id: 31, label: "Chipped", code: "CR_CHIPPED", children: [] },
            { id: 32, label: "Scratched", code: "CR_SCRATCHED", children: [] }
        ]
    },
    {
        id: 4,
        label: "Dial & Hands",
        code: "DIAL",
        children: [
            { id: 40, label: "Discolored", code: "DL_DISCOLOR", children: [] },
            { id: 41, label: "Lume Missing", code: "DL_LUME", children: [] },
            { id: 42, label: "Hands Loose", code: "DL_HANDS", children: [] }
        ]
    },
    {
        id: 5,
        label: "Bracelet / Strap",
        code: "STRAP",
        children: [
            { id: 50, label: "Broken Link", code: "ST_LINK", children: [] },
            { id: 51, label: "Clasp Issue", code: "ST_CLASP", children: [] },
            { id: 52, label: "Worn Out", code: "ST_WORN", children: [] }
        ]
    }
];

const CreateJobPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [brands, setBrands] = useState(DEFAULT_BRANDS);
    const [conditionNodes, setConditionNodes] = useState([]);
    const [complaintNodes, setComplaintNodes] = useState([]);

    // New state for customer lookup and watch selection
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [existingWatches, setExistingWatches] = useState([]);
    const [showWatchModal, setShowWatchModal] = useState(false);
    const [allCustomers, setAllCustomers] = useState([]);

    // State for autofill prompt
    const [pendingCustomer, setPendingCustomer] = useState(null);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                const response = await api.get('/api/v1/brands');
                if (response.data && response.data.length > 0) {
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
            other_issue: '',
            other_issue: '',
            spare_parts: [],
            estimated_cost: '',
            estimated_delivery: ''
        },
        images: []
    });

    const [imagePreviews, setImagePreviews] = useState([]);

    const handleCustomerLookup = async (phoneNumber) => {
        if (!phoneNumber || phoneNumber.length < 3) return;

        setIsSearchingCustomer(true);
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
        } finally {
            setIsSearchingCustomer(false);
        }
    };

    const handleConfirmAutofill = async () => {
        if (!pendingCustomer) return;

        const customer = pendingCustomer;

        // Autofill customer data
        setFormData(prev => ({
            ...prev,
            customer: {
                ...prev.customer,
                id: customer.id,
                name: customer.name || '',
                contact_number: customer.contact_number || prev.customer.contact_number, // Keep current input if needed, or overwrite
                email: customer.email || '',
                address: customer.address || '',
                city: customer.city || '',
                state: customer.state || '',
                country: customer.country || '',
                postal_code: customer.postal_code || '',
                date_of_birth: customer.date_of_birth ? customer.date_of_birth.split('T')[0] : '',
                gender: customer.gender || ''
            }
        }));

        setPendingCustomer(null); // Clear prompt

        // Fetch customer's watches via jobs
        try {
            // 1. Get all jobs for this customer
            const jobsResponse = await api.get(`/api/v1/jobs?customer_id=${customer.id}`);
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
            const newIds = currentIds.includes(nodeId)
                ? currentIds.filter(id => id !== nodeId)
                : [...currentIds, nodeId];

            return {
                ...prev,
                issues: {
                    ...prev.issues,
                    complaint_node_ids: newIds
                }
            };
        });
    };

    const handleSubmit = async () => {
        try {
            // 1. Create/Get Customer
            let customerId = formData.customer.id;
            if (!customerId) {
                // Create new customer
                const customerResponse = await api.post('/api/v1/customers', {
                    name: formData.customer.name,
                    contact_number: formData.customer.contact_number,
                    email: formData.customer.email,
                    address: formData.customer.address,
                    city: formData.customer.city,
                    date_of_birth: formData.customer.date_of_birth,
                    gender: formData.customer.gender
                });
                customerId = customerResponse.data.id;
            } else {
                // Update existing customer
                await api.put(`/api/v1/customers/${customerId}`, {
                    name: formData.customer.name,
                    contact_number: formData.customer.contact_number,
                    email: formData.customer.email,
                    address: formData.customer.address,
                    city: formData.customer.city,
                    date_of_birth: formData.customer.date_of_birth,
                    gender: formData.customer.gender
                });
            }

            // 2. Create Job
            const jobResponse = await api.post('/api/v1/jobs', {
                customer_id: customerId,
                status: 'booked',
                estimated_delivery_date: formData.issues.estimated_delivery,
                notes: formData.issues.other_issue,
                estimated_cost: parseFloat(formData.issues.estimated_cost) || 0
            });
            const jobId = jobResponse.data.id;

            // 3. Create Watch
            const watchResponse = await api.post('/api/v1/watches', {
                job_id: jobId,
                brand_id: parseInt(formData.watch.brand_id),
                model_number: formData.watch.model_number,
                watch_serial_number: formData.watch.watch_serial_number,
                date_of_purchase: formData.watch.date_of_purchase,
                ucp_rate: parseFloat(formData.watch.ucp_rate) || 0,
                other_remarks: formData.watch.other_remarks
            });
            const watchId = watchResponse.data.id;

            // 4. Attach Complaints (Batch)
            if (formData.issues.complaint_node_ids.length > 0) {
                await api.post('/api/v1/complaints/watch-complaints/batch', {
                    watch_id: watchId,
                    complaint_node_ids: formData.issues.complaint_node_ids,
                    notes: "Customer reported"
                });
            }

            // 5. Attach Conditions (Batch)
            if (formData.issues.condition_node_ids.length > 0) {
                await api.post('/api/v1/conditions/watch-conditions/batch', {
                    watch_id: watchId,
                    condition_node_ids: formData.issues.condition_node_ids,
                    notes: "Initial conditions"
                });
            }

            // 5. Upload Images
            if (formData.images.length > 0) {
                for (const image of formData.images) {
                    const formDataImage = new FormData();
                    formDataImage.append('file', image);
                    await api.post(`/api/v1/watches/${watchId}/attachments`, formDataImage, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
            }

            // Navigate to dashboard or job details
            alert('Job Created Successfully!');
            navigate(`/jobs/${jobId}`);

        } catch (error) {
            console.error("Error creating job:", error);
            alert('Failed to create job. Please try again.');
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
                        handleConditionToggle={handleConditionToggle}
                        handleComplaintToggle={handleComplaintToggle}
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
                            onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
                            className="px-6 py-2.5 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors shadow-lg shadow-gray-900/20"
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20 font-medium"
                        >
                            Create Job Card
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
