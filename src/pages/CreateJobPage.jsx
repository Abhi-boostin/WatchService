import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Check, User, Watch, ClipboardList, Camera,
    Phone, Mail, Calendar, MapPin, Globe, Building,
    Upload, X
} from 'lucide-react';

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

const CreateJobPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [brands, setBrands] = useState(DEFAULT_BRANDS);

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

    const [formData, setFormData] = useState({
        customer: {
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
            other_issue: '',
            spare_parts: [],
            estimated_cost: '',
            estimated_delivery: ''
        },
        images: []
    });

    const [imagePreviews, setImagePreviews] = useState([]);

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

    const renderCustomerForm = () => (
        <div className="space-y-8 animate-fadeIn">
            {/* Primary Contact Section */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-blue-600" />
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mobile Number - Priority 1 */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Phone className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="tel"
                                name="contact_number"
                                value={formData.customer.contact_number}
                                onChange={handleCustomerChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none bg-white"
                                placeholder="+1 (555) 000-0000"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                value={formData.customer.email}
                                onChange={handleCustomerChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none bg-white"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Details Section */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.customer.name}
                            onChange={handleCustomerChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            placeholder="John Doe"
                        />
                    </div>

                    {/* DOB */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.customer.date_of_birth}
                                onChange={handleCustomerChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <select
                            name="gender"
                            value={formData.customer.gender}
                            onChange={handleCustomerChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none bg-white"
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Address Section */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Address */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <textarea
                            name="address"
                            value={formData.customer.address}
                            onChange={handleCustomerChange}
                            rows="2"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none resize-none"
                            placeholder="123 Main St, Apt 4B"
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Building className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                name="city"
                                value={formData.customer.city}
                                onChange={handleCustomerChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                placeholder="New York"
                            />
                        </div>
                    </div>

                    {/* State */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State / Province</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.customer.state}
                            onChange={handleCustomerChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            placeholder="NY"
                        />
                    </div>

                    {/* Postal Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                        <input
                            type="text"
                            name="postal_code"
                            value={formData.customer.postal_code}
                            onChange={handleCustomerChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            placeholder="10001"
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Globe className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                name="country"
                                value={formData.customer.country}
                                onChange={handleCustomerChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                placeholder="United States"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderWatchForm = () => (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Watch className="w-4 h-4 text-blue-600" />
                    Watch Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Brand Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                        <select
                            name="brand_id"
                            value={formData.watch.brand_id}
                            onChange={handleWatchChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none bg-white"
                        >
                            <option value="">Select Brand</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                        {/* Display Brand ID below the field */}
                        {formData.watch.brand_id && (
                            <p className="mt-1 text-xs text-gray-500">
                                Selected Brand ID: <span className="font-mono font-medium text-blue-600">{formData.watch.brand_id}</span>
                            </p>
                        )}
                    </div>

                    {/* Model Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Model Number</label>
                        <input
                            type="text"
                            name="model_number"
                            value={formData.watch.model_number}
                            onChange={handleWatchChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            placeholder="Submariner 126610LN"
                        />
                    </div>

                    {/* Watch Serial Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Watch Serial Number</label>
                        <input
                            type="text"
                            name="watch_serial_number"
                            value={formData.watch.watch_serial_number}
                            onChange={handleWatchChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            placeholder="8-digit serial"
                        />
                    </div>

                    {/* Date of Purchase */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Purchase</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="date"
                                name="date_of_purchase"
                                value={formData.watch.date_of_purchase}
                                onChange={handleWatchChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* UCP Rate */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">UCP Rate</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                name="ucp_rate"
                                value={formData.watch.ucp_rate}
                                onChange={handleWatchChange}
                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Other Remarks */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Other Remarks</label>
                        <textarea
                            name="other_remarks"
                            value={formData.watch.other_remarks}
                            onChange={handleWatchChange}
                            rows="3"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none resize-none"
                            placeholder="Any specific remarks about the watch..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );

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

    const [conditionNodes, setConditionNodes] = useState(CONDITION_NODES);

    useEffect(() => {
        const fetchConditionNodes = async () => {
            try {
                const response = await api.get('/api/v1/condition-nodes/tree');
                if (response.data && response.data.length > 0) {
                    setConditionNodes(response.data);
                }
            } catch (error) {
                console.warn("Failed to fetch condition nodes, using default list:", error);
            }
        };
        fetchConditionNodes();
    }, []);

    const ConditionNode = ({ node, level = 0 }) => {
        const isSelected = formData.issues.condition_node_ids.includes(node.id);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div className={`ml-${level * 4} mb-2`}>
                <label className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'} border border-transparent`}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleConditionToggle(node.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className={`text-sm ${level === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {node.label}
                    </span>
                </label>
                {hasChildren && (
                    <div className="ml-6 mt-2 border-l-2 border-gray-100 pl-2">
                        {node.children.map(child => (
                            <ConditionNode key={child.id} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
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

    const renderIssuesForm = () => (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Service Requirements & Conditions
                </h3>

                <div className="space-y-6">
                    {/* Condition Tree */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">Watch Conditions & Issues</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
                            {conditionNodes.map(node => (
                                <ConditionNode key={node.id} node={node} />
                            ))}
                        </div>
                    </div>

                    {/* Other Issues */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Other Observations / Notes</label>
                        <textarea
                            name="other_issue"
                            value={formData.issues.other_issue}
                            onChange={handleIssueChange}
                            rows="3"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none resize-none"
                            placeholder="Specific customer complaints or technician observations..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                        {/* Estimated Cost */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    name="estimated_cost"
                                    value={formData.issues.estimated_cost}
                                    onChange={handleIssueChange}
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Estimated Delivery */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                            <input
                                type="date"
                                name="estimated_delivery"
                                value={formData.issues.estimated_delivery}
                                onChange={handleIssueChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderImagesForm = () => (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Watch Images
                </h3>

                <div className="space-y-6">
                    {/* Upload Area */}
                    <div className="flex justify-center items-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </label>
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                                    <img
                                        src={preview}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => handleRemoveImage(index)}
                                        className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );



    const handleSubmit = async () => {
        try {
            // 1. Create/Get Customer
            let customerId = formData.customer.id;
            if (!customerId) {
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
            }

            // 2. Create Job
            const jobResponse = await api.post('/api/v1/jobs', {
                customer_id: customerId,
                status: 'booked',
                estimated_delivery_date: formData.issues.estimated_delivery,
                notes: formData.issues.other_issue
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

            // 4. Attach Conditions (Batch)
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
            <div className="mb-12">
                <div className="relative flex items-center justify-between w-full">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
                    <div
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((step) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center bg-white px-2">
                                <div
                                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                            isCurrent ? 'bg-white border-gray-900 text-gray-900 scale-110' :
                                                'bg-white border-gray-300 text-gray-300'}
                  `}
                                >
                                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                </div>
                                <span
                                    className={`
                    mt-2 text-xs font-medium transition-colors duration-300
                    ${isCurrent ? 'text-gray-900' : 'text-gray-400'}
                  `}
                                >
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[400px] p-8">
                {currentStep === 1 && renderCustomerForm()}
                {currentStep === 2 && renderWatchForm()}
                {currentStep === 3 && renderIssuesForm()}
                {currentStep === 4 && renderImagesForm()}

                <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                    <button
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                        className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => {
                            if (currentStep === 4) {
                                handleSubmit();
                            } else {
                                setCurrentStep(prev => Math.min(4, prev + 1));
                            }
                        }}
                        className="px-8 py-2.5 rounded-xl bg-[#0F172A] text-white hover:bg-[#1E293B] disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-gray-900/20 transition-all transform active:scale-95"
                    >
                        {currentStep === 4 ? 'Create Job' : 'Next Step'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateJobPage;
