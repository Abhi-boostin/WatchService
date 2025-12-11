import React from 'react';

/**
 * HierarchicalNodeSelector - A reusable tree component for selecting nodes
 * Used for both complaints and conditions in create and edit flows
 */
const HierarchicalNode = ({ node, level = 0, selectedIds, onToggle }) => {
    const isSelected = selectedIds.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;

    if (hasChildren) {
        return (
            <div className={`ml-${level * 4} mb-2`}>
                <div className="p-2">
                    <span className="text-sm font-semibold text-gray-900">
                        {node.label}
                    </span>
                </div>
                <div className="ml-6 mt-1 border-l-2 border-gray-100 pl-2">
                    {node.children.map(child => (
                        <HierarchicalNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            selectedIds={selectedIds}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`ml-${level * 4} mb-2`}>
            <label className={`flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'} border border-transparent`}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(node.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                    {node.label}
                </span>
            </label>
        </div>
    );
};

const HierarchicalNodeSelector = ({ nodes, selectedIds, onToggle, label, emptyMessage = "No items available" }) => {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-4">{label}</label>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
                {nodes && nodes.length > 0 ? (
                    nodes.map(node => (
                        <HierarchicalNode
                            key={node.id}
                            node={node}
                            selectedIds={selectedIds}
                            onToggle={onToggle}
                        />
                    ))
                ) : (
                    <div className="col-span-2 text-center py-4 text-gray-500 text-sm italic">
                        {emptyMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HierarchicalNodeSelector;
