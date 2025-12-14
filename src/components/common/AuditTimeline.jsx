import React, { useState } from 'react';
import { Clock, User, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const AuditTimeline = ({ events, loading, error, currentPage, totalPages, onPageChange }) => {
    const [expandedEvents, setExpandedEvents] = useState(new Set());

    const toggleExpand = (eventId) => {
        setExpandedEvents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(eventId)) {
                newSet.delete(eventId);
            } else {
                newSet.add(eventId);
            }
            return newSet;
        });
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown date';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getActionBadge = (action) => {
        const badges = {
            CREATE: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Created' },
            UPDATE: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Updated' },
            DELETE: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Deleted' },
            STATUS_CHANGE: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Status Changed' },
        };
        const badge = badges[action] || { color: 'bg-gray-100 text-gray-700 border-gray-200', label: action };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium border ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const getUserDisplay = (event) => {
        const userName = event.user_name || event.username || 'Unknown User';
        const isInactive = event.user_inactive || false;
        const isSystem = event.is_system || false;

        if (isSystem) {
            return (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 font-medium">System</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        Automated
                    </span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">{userName}</span>
                {isInactive && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                        Inactive
                    </span>
                )}
            </div>
        );
    };

    const renderChangeDetails = (changes) => {
        if (!changes || typeof changes !== 'object') {
            return <p className="text-sm text-gray-500 italic">No details available</p>;
        }

        const changeEntries = Object.entries(changes);
        if (changeEntries.length === 0) {
            return <p className="text-sm text-gray-500 italic">No changes recorded</p>;
        }

        return (
            <div className="space-y-2">
                {changeEntries.map(([field, value]) => {
                    // Handle old/new value pairs
                    if (value && typeof value === 'object' && ('old' in value || 'new' in value)) {
                        const oldValue = value.old !== null && value.old !== undefined ? String(value.old) : 'None';
                        const newValue = value.new !== null && value.new !== undefined ? String(value.new) : 'None';
                        
                        return (
                            <div key={field} className="text-sm">
                                <span className="font-medium text-gray-700 capitalize">
                                    {field.replace(/_/g, ' ')}:
                                </span>
                                <div className="ml-4 mt-1 flex items-center gap-2">
                                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs line-through">
                                        {oldValue}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                                        {newValue}
                                    </span>
                                </div>
                            </div>
                        );
                    }
                    
                    // Handle simple values
                    return (
                        <div key={field} className="text-sm">
                            <span className="font-medium text-gray-700 capitalize">
                                {field.replace(/_/g, ' ')}:
                            </span>
                            <span className="ml-2 text-gray-600">{String(value)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const getEventSummary = (event) => {
        if (event.summary) return event.summary;
        
        // Fallback summary generation
        const action = event.action || 'Unknown action';
        const entityType = event.entity_type || 'item';
        return `${action.toLowerCase().replace('_', ' ')} ${entityType}`;
    };

    const shouldShowExpandButton = (event) => {
        return event.changes && Object.keys(event.changes).length > 0;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <p className="text-red-600 font-medium">Failed to load audit history</p>
                <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No history available yet</p>
                <p className="text-sm text-gray-400 mt-1">Changes will appear here once actions are performed</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Timeline Events */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                    {events.map((event, index) => {
                        const isExpanded = expandedEvents.has(event.id);
                        const showExpand = shouldShowExpandButton(event);

                        return (
                            <div key={event.id} className="relative">
                                {/* Timeline connector */}
                                {index < events.length - 1 && (
                                    <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-gray-200" />
                                )}

                                {/* Event Card */}
                                <div className="flex gap-4">
                                    {/* Timeline dot */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                            event.action === 'CREATE' ? 'bg-green-500' :
                                            event.action === 'UPDATE' ? 'bg-blue-500' :
                                            event.action === 'DELETE' ? 'bg-red-500' :
                                            event.action === 'STATUS_CHANGE' ? 'bg-amber-500' :
                                            'bg-gray-400'
                                        }`}>
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        </div>
                                    </div>

                                    {/* Event Content */}
                                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getActionBadge(event.action)}
                                                    <span className="text-xs text-gray-500">
                                                        {formatTimestamp(event.timestamp || event.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">
                                                    {getEventSummary(event)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* User */}
                                        <div className="flex items-center gap-1 mb-3 text-xs text-gray-500">
                                            <User className="w-3 h-3" />
                                            {getUserDisplay(event)}
                                        </div>

                                        {/* Expandable Change Details */}
                                        {showExpand && (
                                            <>
                                                <button
                                                    onClick={() => toggleExpand(event.id)}
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <ChevronUp className="w-4 h-4" />
                                                            Hide Details
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-4 h-4" />
                                                            View Details
                                                        </>
                                                    )}
                                                </button>

                                                {isExpanded && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                                        {renderChangeDetails(event.changes)}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            
                            {/* Page numbers */}
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => onPageChange(pageNum)}
                                            className={`px-3 py-1 text-sm border rounded transition-colors ${
                                                currentPage === pageNum
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditTimeline;

