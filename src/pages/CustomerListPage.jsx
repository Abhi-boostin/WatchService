import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, Mail, MapPin, Plus, Loader2, Trash2, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import CustomDatePicker from '../components/common/CustomDatePicker';

const CustomerListPage = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalType, setModalType] = useState(null); // 'edit', 'delete'
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/v1/customers?page=1&page_size=50');
            setCustomers(response.data.items || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact_number.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Actions
    const openDeleteModal = (customer, e) => {
        e.stopPropagation();
        setSelectedCustomer(customer);
        setModalType('delete');
    };

    const closeModal = () => {
        setSelectedCustomer(null);
        setModalType(null);
        setFormData({});
    };

    const openCreateModal = () => {
        setFormData({
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
        });
        setModalType('create');
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            // Filter out empty strings for optional fields to avoid validation errors
            const customerData = { ...formData };
            Object.keys(customerData).forEach(key => {
                if (customerData[key] === '' || customerData[key] === null || customerData[key] === undefined) {
                    delete customerData[key];
                }
            });
            
            await api.post('/api/v1/customers', customerData);
            fetchCustomers();
            closeModal();
        } catch (error) {
            console.error("Error creating customer:", error);
            alert("Failed to create customer");
        }
    };

    const handleDeleteCustomer = async () => {
        try {
            await api.delete(`/api/v1/customers/${selectedCustomer.id}`);
            fetchCustomers();
            closeModal();
        } catch (error) {
            console.error("Error deleting customer:", error);
            alert("Failed to delete customer");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500 mt-1">Manage your customer base</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition-colors shadow-lg shadow-gray-900/20"
                >
                    <Plus size={20} />
                    <span>Add Customer</span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-8 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search customers by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all bg-white shadow-sm"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg">No customers found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map((customer) => (
                        <div
                            key={customer.id}
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg group-hover:scale-110 transition-transform">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => openDeleteModal(customer, e)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete Customer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{customer.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">ID: {customer.id}</p>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Phone size={16} className="text-gray-400" />
                                    <span className="text-sm">{customer.contact_number}</span>
                                </div>
                                {customer.email && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Mail size={16} className="text-gray-400" />
                                        <span className="text-sm truncate">{customer.email}</span>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-start gap-3 text-gray-600">
                                        <MapPin size={16} className="text-gray-400 mt-0.5" />
                                        <span className="text-sm line-clamp-2">{customer.address}, {customer.city}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            {modalType && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalType === 'create' && 'Add Customer'}
                                {modalType === 'delete' && 'Delete Customer'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {modalType === 'create' && (
                                <form onSubmit={handleCreateCustomer} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input type="text" required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                            <input type="text" required value={formData.contact_number || ''} onChange={e => setFormData({ ...formData, contact_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <input type="text" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                            <input type="text" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                            <input type="text" value={formData.state || ''} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                            <input type="text" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                                            <input type="text" value={formData.postal_code || ''} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <CustomDatePicker
                                                label="Date of Birth"
                                                name="date_of_birth"
                                                value={formData.date_of_birth || ''}
                                                onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                                                placeholder="Select Date of Birth"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                            <select
                                                value={formData.gender || ''}
                                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                            Create Customer
                                        </button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'delete' && (
                                <div>
                                    <div className="flex items-center gap-4 mb-6 bg-red-50 p-4 rounded-xl text-red-700">
                                        <AlertTriangle size={24} />
                                        <p>Are you sure you want to delete this customer? This action cannot be undone.</p>
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button onClick={handleDeleteCustomer} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete Customer</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerListPage;
