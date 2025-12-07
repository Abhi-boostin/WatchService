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
    FolderOpen
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

const SubItem = ({ label, to, count }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `
      flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
      ${isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
    `}
    >
        <span>{label}</span>
        {count && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${count > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                {count}
            </span>
        )}
    </NavLink>
);

const Sidebar = () => {
    const [openSections, setOpenSections] = useState({
        product: true,
        customers: false,
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
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
                {/* Main Section */}
                <div>
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />

                    <SidebarItem
                        icon={Package}
                        label="Jobs"
                        isOpen={openSections.product}
                        onToggle={() => toggleSection('product')}
                    >
                        <SubItem label="Overview" to="/jobs" />
                        <SubItem label="Active Jobs" to="/jobs/active" count={3} />
                        <SubItem label="Completed" to="/jobs/completed" />
                        <SubItem label="Pending" to="/jobs/pending" count={8} />
                    </SidebarItem>

                    <SidebarItem
                        icon={Users}
                        label="Customers"
                        isOpen={openSections.customers}
                        onToggle={() => toggleSection('customers')}
                    >
                        <SubItem label="All Customers" to="/customers" />
                        <SubItem label="Add New" to="/customers/new" />
                    </SidebarItem>

                    <SidebarItem icon={ShoppingBag} label="Inventory" to="/inventory" />
                </div>

                {/* Secondary Section */}
                <div>
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Management
                    </div>
                    <SidebarItem icon={BarChart3} label="Reports" to="/reports" />
                    <SidebarItem icon={FolderOpen} label="Files" to="/files" />
                    <SidebarItem icon={Settings} label="Settings" to="/settings" />
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
