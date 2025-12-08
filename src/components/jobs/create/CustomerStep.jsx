import React from 'react';
import { Phone, Mail, User, Calendar, MapPin, Building, Globe } from 'lucide-react';

const CustomerStep = ({ formData, handleChange, onPhoneBlur }) => {
    const { customer } = formData;

    return (
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
                                value={customer.contact_number}
                                onChange={handleChange}
                                onBlur={(e) => onPhoneBlur && onPhoneBlur(e.target.value)}
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
                                value={customer.email}
                                onChange={handleChange}
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
                            value={customer.name}
                            onChange={handleChange}
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
                                value={customer.date_of_birth}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Gender */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <select
                            name="gender"
                            value={customer.gender}
                            onChange={handleChange}
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
                            value={customer.address}
                            onChange={handleChange}
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
                                value={customer.city}
                                onChange={handleChange}
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
                            value={customer.state}
                            onChange={handleChange}
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
                            value={customer.postal_code}
                            onChange={handleChange}
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
                                value={customer.country}
                                onChange={handleChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none"
                                placeholder="United States"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerStep;
