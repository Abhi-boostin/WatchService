import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Clock, Globe } from 'lucide-react';
import api from '../services/api';

const CustomerDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
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
        </div>
    );
};

export default CustomerDetailsPage;
