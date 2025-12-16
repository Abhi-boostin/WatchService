import React, { useState, useEffect } from 'react';
import { 
    Server, Database, Trash2, Download, RefreshCw, 
    AlertTriangle, CheckCircle, Clock, HardDrive,
    Play, Eye, X, Calendar, FileArchive, Activity
} from 'lucide-react';
import { systemService } from '../services/api';

const SystemAdministrationPage = () => {
    const [activeTab, setActiveTab] = useState('status');
    const [workerStatus, setWorkerStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchWorkerStatus();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchWorkerStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchWorkerStatus = async () => {
        try {
            setRefreshing(true);
            const status = await systemService.getWorkerStatus();
            setWorkerStatus(status);
        } catch (error) {
            console.error('Failed to fetch worker status:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const tabs = [
        { id: 'status', label: 'Worker Status', icon: Activity },
        { id: 'cleanup', label: 'Cleanup Management', icon: Trash2 },
        { id: 'backup', label: 'Backup Management', icon: Database },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Server className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>
                </div>
                <p className="text-gray-500 ml-14">Manage background workers, cleanup operations, and database backups</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'status' && (
                <WorkerStatusTab 
                    workerStatus={workerStatus} 
                    loading={loading} 
                    refreshing={refreshing}
                    onRefresh={fetchWorkerStatus}
                />
            )}
            {activeTab === 'cleanup' && <CleanupManagementTab />}
            {activeTab === 'backup' && <BackupManagementTab />}
        </div>
    );
};

// Worker Status Tab Component
const WorkerStatusTab = ({ workerStatus, loading, refreshing, onRefresh }) => {
    const formatDateTime = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return null;
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = date - now;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        // Handle past times
        if (diffMs < 0) {
            return 'Overdue';
        }
        
        // Handle future times
        if (diffDays > 0) {
            return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        }
        if (diffHours > 0) {
            return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        }
        if (diffMins > 0) {
            return `in ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
        }
        return 'in less than a minute';
    };

    const StatusCard = ({ title, status, icon: Icon, color }) => (
        <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-lg font-semibold text-gray-900">{status}</p>
                </div>
            </div>
        </div>
    );

    const TaskExecutionCard = ({ title, taskInfo, icon: Icon, color }) => {
        const getStatusColor = (status) => {
            if (status === 'success') return 'text-green-600 bg-green-50';
            if (status === 'failed') return 'text-red-600 bg-red-50';
            if (status === 'never_run') return 'text-gray-600 bg-gray-50';
            return 'text-gray-600 bg-gray-50';
        };

        return (
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>

                {taskInfo && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(taskInfo.status)}`}>
                                {taskInfo.status.replace('_', ' ')}
                            </span>
                        </div>

                        {taskInfo.timestamp && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Last Run</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {formatDateTime(taskInfo.timestamp)}
                                </span>
                            </div>
                        )}

                        {taskInfo.files_deleted !== null && taskInfo.files_deleted !== undefined && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Files Deleted</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {taskInfo.files_deleted.toLocaleString()}
                                </span>
                            </div>
                        )}

                        {taskInfo.space_freed_mb !== null && taskInfo.space_freed_mb !== undefined && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Space Freed</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {taskInfo.space_freed_mb.toFixed(2)} MB
                                </span>
                            </div>
                        )}

                        {taskInfo.backup_size_mb !== null && taskInfo.backup_size_mb !== undefined && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Backup Size</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {taskInfo.backup_size_mb.toFixed(2)} MB
                                </span>
                            </div>
                        )}

                        {taskInfo.duration_seconds !== null && taskInfo.duration_seconds !== undefined && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Duration</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {taskInfo.duration_seconds.toFixed(2)}s
                                </span>
                            </div>
                        )}

                        {taskInfo.error_message && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                <p className="text-xs text-red-600 font-medium">Error:</p>
                                <p className="text-xs text-red-700 mt-1">{taskInfo.error_message}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!workerStatus) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Refresh */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
                <button
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusCard
                    title="Scheduler Status"
                    status={workerStatus.scheduler_running ? 'Running' : 'Stopped'}
                    icon={workerStatus.scheduler_running ? CheckCircle : AlertTriangle}
                    color={workerStatus.scheduler_running ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                />
                <StatusCard
                    title="Next Cleanup"
                    status={workerStatus.next_cleanup ? formatRelativeTime(workerStatus.next_cleanup) : 'Not Scheduled'}
                    icon={Clock}
                    color="bg-blue-100 text-blue-600"
                />
                <StatusCard
                    title="Next Backup"
                    status={workerStatus.next_backup ? formatRelativeTime(workerStatus.next_backup) : 'Not Scheduled'}
                    icon={Calendar}
                    color="bg-purple-100 text-purple-600"
                />
            </div>

            {/* Last Execution Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TaskExecutionCard
                    title="Last Cleanup"
                    taskInfo={workerStatus.last_cleanup}
                    icon={Trash2}
                    color="bg-orange-100 text-orange-600"
                />
                <TaskExecutionCard
                    title="Last Backup"
                    taskInfo={workerStatus.last_backup}
                    icon={Database}
                    color="bg-green-100 text-green-600"
                />
            </div>
        </div>
    );
};

// Cleanup Management Tab Component
const CleanupManagementTab = () => {
    const [daysThreshold, setDaysThreshold] = useState(90);
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const handlePreview = async () => {
        try {
            setLoading(true);
            const data = await systemService.previewCleanup(daysThreshold);
            setPreviewData(data);
        } catch (error) {
            console.error('Preview failed:', error);
            alert(error.displayMessage || 'Failed to preview cleanup');
        } finally {
            setLoading(false);
        }
    };

    const handleExecute = async () => {
        try {
            setExecuting(true);
            const result = await systemService.runCleanup(daysThreshold);
            alert(`Cleanup completed successfully!\n\nJobs processed: ${result.jobs_processed}\nFiles deleted: ${result.files_deleted}\nSpace freed: ${result.space_freed_mb.toFixed(2)} MB`);
            setPreviewData(null);
            setShowConfirmModal(false);
        } catch (error) {
            console.error('Cleanup failed:', error);
            alert(error.displayMessage || 'Failed to run cleanup');
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Configuration */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cleanup Configuration</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Days Threshold
                        </label>
                        <input
                            type="number"
                            value={daysThreshold}
                            onChange={(e) => setDaysThreshold(parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Enter number of days"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Delete attachments from jobs completed/delivered more than {daysThreshold} days ago
                        </p>
                    </div>

                    <button
                        onClick={handlePreview}
                        disabled={loading || !daysThreshold}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Eye className="w-4 h-4" />
                        {loading ? 'Loading...' : 'Preview Cleanup'}
                    </button>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-amber-900 mb-1">Warning: Destructive Operation</h4>
                        <p className="text-sm text-amber-700">
                            This operation will permanently delete attachment files from the filesystem. 
                            Always preview before running cleanup. This action cannot be undone.
                        </p>
                    </div>
                </div>
            </div>

            {/* Preview Results */}
            {previewData && (
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Results</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Jobs Affected</p>
                            <p className="text-2xl font-bold text-gray-900">{previewData.total_jobs}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Cutoff Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {new Date(previewData.cutoff_date).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {previewData.candidates && previewData.candidates.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                Affected Jobs (showing {Math.min(10, previewData.candidates.length)} of {previewData.candidates.length})
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Number</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attachments</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {previewData.candidates.slice(0, 10).map((job) => (
                                            <tr key={job.job_id}>
                                                <td className="px-4 py-3 text-sm font-mono text-gray-900">
                                                    #{job.job_number || job.job_id}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                                                    {job.status.replace('_', ' ')}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {job.completed_at 
                                                        ? new Date(job.completed_at).toLocaleDateString('en-IN')
                                                        : job.delivered_at 
                                                        ? new Date(job.delivered_at).toLocaleDateString('en-IN')
                                                        : 'N/A'
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {job.attachment_count}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {previewData.total_jobs === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No jobs found matching the cleanup criteria.</p>
                            <p className="text-sm mt-2">Try adjusting the days threshold.</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={executing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play className="w-4 h-4" />
                            {executing ? 'Running...' : 'Run Cleanup'}
                        </button>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Confirm Cleanup</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete attachments from {previewData?.total_jobs} job(s)? 
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleExecute}
                                disabled={executing}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {executing ? 'Running...' : 'Yes, Delete Attachments'}
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                disabled={executing}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Backup Management Tab Component
const BackupManagementTab = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [includeAttachments, setIncludeAttachments] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        try {
            setLoading(true);
            const data = await systemService.listBackups();
            setBackups(data.backups || []);
        } catch (error) {
            console.error('Failed to fetch backups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBackup = async () => {
        try {
            setCreating(true);
            const result = await systemService.createBackup(includeAttachments);
            
            // Extract filename from backup_path
            const filename = result.backup_path ? result.backup_path.split('/').pop() : 'backup file';
            
            alert(`Backup created successfully!\n\nFilename: ${filename}\nSize: ${result.file_size_mb.toFixed(2)} MB\nDuration: ${result.duration_seconds.toFixed(2)}s`);
            fetchBackups();
        } catch (error) {
            console.error('Backup creation failed:', error);
            alert(error.displayMessage || 'Failed to create backup');
        } finally {
            setCreating(false);
        }
    };

    const handleDownload = async (filename) => {
        try {
            const response = await systemService.downloadBackup(filename);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download backup');
        }
    };

    const handleDelete = async (filename) => {
        try {
            await systemService.deleteBackup(filename);
            alert('Backup deleted successfully');
            fetchBackups();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Delete failed:', error);
            alert(error.displayMessage || 'Failed to delete backup');
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        if (mb > 1024) {
            return `${(mb / 1024).toFixed(2)} GB`;
        }
        return `${mb.toFixed(2)} MB`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    return (
        <div className="space-y-6">
            {/* Create Backup */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Backup</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="includeAttachments"
                            checked={includeAttachments}
                            onChange={(e) => setIncludeAttachments(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="includeAttachments" className="text-sm font-medium text-gray-700">
                            Include attachment files (will take longer and create larger backup)
                        </label>
                    </div>

                    <button
                        onClick={handleCreateBackup}
                        disabled={creating}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Database className="w-4 h-4" />
                        {creating ? 'Creating Backup...' : 'Create Backup Now'}
                    </button>
                </div>
            </div>

            {/* Backup List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Available Backups</h3>
                    <button
                        onClick={fetchBackups}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : backups.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <FileArchive className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p>No backups found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {backups.map((backup) => (
                                    <tr key={backup.filename} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FileArchive className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-mono text-gray-900">{backup.filename}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(backup.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatFileSize(backup.size_bytes)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                backup.type === 'manual' 
                                                    ? 'bg-blue-100 text-blue-700' 
                                                    : 'bg-green-100 text-green-700'
                                            }`}>
                                                {backup.type || 'manual'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownload(backup.filename)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(backup.filename)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete Backup</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            Are you sure you want to delete this backup?
                        </p>
                        <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded mb-6">
                            {deleteConfirm}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemAdministrationPage;

