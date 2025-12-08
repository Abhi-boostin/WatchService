import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
    Plus
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
            </nav>

            {/* User Profile (Optional footer) */}
            <div className="mt-auto pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-xs">
                        JD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
                        <p className="text-xs text-gray-500 truncate">Admin</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
