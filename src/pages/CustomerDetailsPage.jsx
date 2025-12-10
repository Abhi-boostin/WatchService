import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, Globe, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

const CustomerDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [modalType, setModalType] = useState(null); // 'edit', 'delete'
    const [formData, setFormData] = useState({});

    useEffect(() => {
        let mounted = true;

        const fetchCustomerDetails = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/api/v1/customers/${id}`);
                if (mounted) {
                    setCustomer(response.data);
                }
            } catch (error) {
                console.error("Error fetching customer details:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (id) {
            fetchCustomerDetails();
        }

        return () => {
            mounted = false;
        };
    }, [id]);

    // Actions
    const openEditModal = () => {
        setFormData({
            name: customer.name,
            contact_number: customer.contact_number,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            country: customer.country,
            postal_code: customer.postal_code,
            date_of_birth: customer.date_of_birth,
            gender: customer.gender
        });
        setModalType('edit');
    };

    const openDeleteModal = () => {
        setModalType('delete');
    };

    const closeModal = () => {
        setModalType(null);
        setFormData({});
    };

    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        try {
            const response = await api.patch(`/api/v1/customers/${id}`, formData);
            setCustomer(response.data);
            closeModal();
        } catch (error) {
            console.error("Error updating customer:", error);
            alert("Failed to update customer");
        }
    };

    const handleDeleteCustomer = async () => {
        try {
            await api.delete(`/api/v1/customers/${id}`);
            navigate('/customers');
        } catch (error) {
            console.error("Error deleting customer:", error);
            alert("Failed to delete customer");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Customer not found</h2>
                <button onClick={() => navigate('/customers')} className="mt-4 text-blue-600 hover:underline">
                    Back to Customers
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/customers')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                        <p className="text-gray-500">Customer ID: {customer.id}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={openEditModal}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-medium"
                    >
                        <Pencil size={18} />
                        <span>Edit</span>
                    </button>
                    <button
                        onClick={openDeleteModal}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all shadow-sm font-medium"
                    >
                        <Trash2 size={18} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <User size={20} className="text-blue-600" />
                        Personal Information
                    </h2>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                        <label className="text-sm text-gray-500 flex items-center gap-2">
                            <Phone size={14} /> Contact Number
                        </label>
                        <p className="font-medium text-gray-900">{customer.contact_number || '-'}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-500 flex items-center gap-2">
                            <Mail size={14} /> Email Address
                        </label>
                        <p className="font-medium text-gray-900">{customer.email || '-'}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar size={14} /> Date of Birth
                        </label>
                        <p className="font-medium text-gray-900">
                            {customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : '-'}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-500 flex items-center gap-2">
                            <User size={14} /> Gender
                        </label>
                        <p className="font-medium text-gray-900 capitalize">{customer.gender || '-'}</p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin size={20} className="text-blue-600" />
                        Address Details
                    </h2>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-sm text-gray-500">Street Address</label>
                        <p className="font-medium text-gray-900">{customer.address || '-'}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-500">City</label>
                        <p className="font-medium text-gray-900">{customer.city || '-'}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-500">State / Province</label>
                        <p className="font-medium text-gray-900">{customer.state || '-'}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-500 flex items-center gap-2">
                            <Globe size={14} /> Country
                        </label>
                        <p className="font-medium text-gray-900">{customer.country || '-'}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-500">Postal Code</label>
                        <p className="font-medium text-gray-900">{customer.postal_code || '-'}</p>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <Clock size={14} />
                        Created: {new Date(customer.created_at).toLocaleString()}
                    </div>
                    <div>
                        Last Updated: {new Date(customer.updated_at).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {modalType && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {modalType === 'edit' && 'Edit Customer'}
                                {modalType === 'delete' && 'Delete Customer'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {modalType === 'edit' && (
                                <form onSubmit={handleUpdateCustomer} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                            <input type="text" required value={formData.contact_number} onChange={e => setFormData({ ...formData, contact_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200" />
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
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
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

export default CustomerDetailsPage;
