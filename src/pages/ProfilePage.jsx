import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Clock } from 'lucide-react';
import api from '../services/api';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/api/v1/auth/me');
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user info:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Failed to load profile.</p>
            </div>
        );
    }

    const getRoleBadgeColor = (user) => {
        if (user.is_admin) return 'bg-purple-100 text-purple-800 border-purple-200';
        if (user.is_manager) return 'bg-blue-100 text-blue-800 border-blue-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getRoleLabel = (user) => {
        if (user.is_admin) return 'Administrator';
        if (user.is_manager) return 'Manager';
        return 'Staff';
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header / Banner */}
                <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-900"></div>

                <div className="px-8 pb-8">
                    {/* Avatar & Basic Info */}
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                                <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-2xl font-bold text-gray-600">
                                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="mb-1">
                                <h2 className="text-2xl font-bold text-gray-900">{user.full_name || user.username}</h2>
                                <p className="text-gray-500">@{user.username}</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user)}`}>
                            {getRoleLabel(user)}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Mail size={16} />
                                Email Address
                            </label>
                            <p className="text-gray-900 font-medium">{user.email || 'No email provided'}</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Shield size={16} />
                                Account Status
                            </label>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <p className="text-gray-900 font-medium">{user.is_active ? 'Active' : 'Inactive'}</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Calendar size={16} />
                                Joined On
                            </label>
                            <p className="text-gray-900 font-medium">
                                {new Date(user.created_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Clock size={16} />
                                Last Updated
                            </label>
                            <p className="text-gray-900 font-medium">
                                {new Date(user.updated_at).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
