import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../services/api';
import {
    LayoutDashboard,
    Package,
    Users,
    ShoppingBag,
    BarChart3,
    Settings,
    ChevronDown,
    ChevronRight,
    Watch,
    FolderOpen,
    Plus,
    ClipboardList,
    Tag,
    FileBarChart,
    UserCog,
    DollarSign
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to, children, isOpen, onToggle, isActive }) => {
    const hasChildren = children && children.length > 0;

    return (
        <div className="mb-1">
            <NavLink
                to={to || '#'}
                onClick={(e) => {
                    if (hasChildren) {
                        e.preventDefault();
                        onToggle();
                    }
                }}
                className={({ isActive: routeActive }) => `
          flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group
          ${(isActive || routeActive) && !hasChildren ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}
        `}
            >
                <div className="flex items-center gap-3">
                    <Icon size={20} strokeWidth={1.5} className="group-hover:scale-105 transition-transform" />
                    <span className="font-medium text-sm">{label}</span>
                </div>
                {hasChildren && (
                    <div className="text-gray-400">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                )}
            </NavLink>

            {hasChildren && isOpen && (
                <div className="ml-4 pl-4 border-l border-gray-200 mt-1 space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
};

const Sidebar = () => {
    const [user, setUser] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/api/v1/auth/me');
                setUser(response.data);
            } catch (error) {
                console.error("Failed to fetch user info:", error);
            }
        };
        fetchUser();
    }, []);

    const getUserInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getUserRole = (user) => {
        if (user.is_admin) return 'Administrator';
        if (user.is_manager) return 'Manager';
        return 'Staff';
    };

    return (
        <div className="w-64 h-screen bg-[#F7F7F8] border-r border-gray-200 flex flex-col p-4">
            {/* Logo */}
            <div className="flex items-center gap-3 px-2 mb-8 mt-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white">
                    <Watch size={18} />
                </div>
                <span className="font-bold text-lg text-gray-900 tracking-tight">WatchService</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-6 overflow-y-auto">
                {/* New Booking Action */}
                <div className="mb-6">
                    <NavLink
                        to="/jobs/new"
                        className="flex items-center justify-center gap-3 w-full bg-[#0F172A] text-white py-3.5 px-4 rounded-xl shadow-lg shadow-[#0F172A]/20 hover:bg-[#1E293B] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-medium tracking-wide">New Booking</span>
                    </NavLink>
                </div>

                {/* Main Section */}
                <div>
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
                    <SidebarItem icon={Package} label="Jobs" to="/jobs" />
                    <SidebarItem icon={Users} label="Customers" to="/customers" />
                </div>

                {/* Inventory Section */}
                <div>
                    <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Inventory</p>
                    <SidebarItem icon={ClipboardList} label="Indents" to="/indents" />
                    <SidebarItem icon={Tag} label="Brands" to="/brands" />
                    <SidebarItem icon={ShoppingBag} label="Suppliers" to="/suppliers" />
                </div>

                {/* Reports Section */}
                <div>
                    <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reports</p>
                    <SidebarItem icon={FileBarChart} label="Reports" to="/reports" />
                </div>

                {/* Settings Section (Admin Only) */}
                {user?.is_admin && (
                    <div>
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Settings</p>
                        <SidebarItem
                            icon={Settings}
                            label="Settings"
                            isOpen={isSettingsOpen}
                            onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
                        >
                            <SidebarItem icon={ClipboardList} label="Service Parameters" to="/settings/service-parameters" />
                            <SidebarItem icon={DollarSign} label="Pricing Rules" to="/settings/pricing-rules" />
                            <SidebarItem icon={UserCog} label="Users" to="/settings/users" />
                        </SidebarItem>
                    </div>
                )}
            </nav>

            {/* User Profile (Optional footer) */}
            <div className="mt-auto pt-4 border-t border-gray-200">
                <NavLink
                    to="/profile"
                    className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs group-hover:bg-gray-300 transition-colors">
                        {user ? getUserInitials(user.full_name || user.username) : '...'}
                    </div>
                    <div className="flex-1 min-w-0">
                        {user ? (
                            <>
                                <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || user.username}</p>
                                <p className="text-xs text-gray-500 truncate">{getUserRole(user)}</p>
                            </>
                        ) : (
                            <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                        )}
                    </div>
                </NavLink>
            </div>
        </div>
    );
};

export default Sidebar;
