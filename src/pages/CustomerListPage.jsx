import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, Mail, MapPin, Plus, Loader2 } from 'lucide-react';
import api from '../services/api';

const CustomerListPage = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            // Fetching with a large page size to get "all" for now, or use pagination if API supports it
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

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500 mt-1">Manage your customer base</p>
                </div>
                <button
                    onClick={() => navigate('/customers/new')} // Assuming this route exists or will exist
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
                        <div key={customer.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg group-hover:scale-110 transition-transform">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                {/* <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                    <Edit2 size={18} />
                                </button> */}
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
        </div>
    );
};

export default CustomerListPage;
