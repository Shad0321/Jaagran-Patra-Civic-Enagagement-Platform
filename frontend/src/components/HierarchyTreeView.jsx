import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Users,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Crown,
} from 'lucide-react';

const HierarchyTreeView = ({ data, onEditMember, onDeleteMember }) => {
  const [expandedItems, setExpandedItems] = useState({
    mla: true,
    bodies: {},
  });

  const toggleExpanded = (type, id = null) => {
    if (type === 'mla') {
      setExpandedItems(prev => ({
        ...prev,
        mla: !prev.mla,
      }));
    } else if (type === 'body') {
      setExpandedItems(prev => ({
        ...prev,
        bodies: {
          ...prev.bodies,
          [id]: !prev.bodies[id],
        },
      }));
    }
  };

  const getStatusIcon = (member) => {
    if (!member.isActive) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (member.assignedIssuesCount > 0) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getMemberStatusColor = (member) => {
    if (!member.isActive) return 'text-red-600';
    if (member.assignedIssuesCount > 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8 text-gray-500">
          <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Loading hierarchy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Organizational Hierarchy
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          MLA → Bodies → Members structure
        </p>
      </div>

      <div className="p-6">
        {/* MLA Level */}
        <div className="mb-6">
          <div
            className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => toggleExpanded('mla')}
          >
            {expandedItems.mla ? (
              <ChevronDown className="h-5 w-5 text-blue-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-blue-600" />
            )}
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">{data.mla.name}</h3>
              <p className="text-sm text-blue-700">MLA - {data.mla.email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-blue-900">
                {data.mla.totalMembers} Members
              </p>
              <p className="text-xs text-blue-600">
                {data.bodies.length} Bodies
              </p>
            </div>
          </div>

          {/* Bodies Level */}
          {expandedItems.mla && (
            <div className="ml-8 mt-4 space-y-3">
              {data.bodies.length > 0 ? (
                data.bodies.map((body) => (
                  <div key={body.id}>
                    <div
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleExpanded('body', body.id)}
                    >
                      {expandedItems.bodies[body.id] ? (
                        <ChevronDown className="h-4 w-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      )}
                      <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Building className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{body.name}</h4>
                        <p className="text-sm text-gray-600">
                          {body.type.replace(/_/g, ' ')} - {body.code}
                        </p>
                        {body.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {body.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {body.memberCount} Members
                        </p>
                        {body.state && (
                          <p className="text-xs text-gray-500">
                            {body.state.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Members Level */}
                    {expandedItems.bodies[body.id] && (
                      <div className="ml-8 mt-3 space-y-2">
                        {body.members.length > 0 ? (
                          body.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-medium text-gray-900">
                                    {member.name}
                                  </h5>
                                  {getStatusIcon(member)}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {member.designation || 'Member'}
                                </p>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{member.email}</span>
                                  </div>
                                  {member.phone && (
                                    <div className="flex items-center space-x-1">
                                      <Phone className="h-3 w-3" />
                                      <span>{member.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <p className={`font-medium ${getMemberStatusColor(member)}`}>
                                  {member.isActive ? 'Active' : 'Inactive'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {member.assignedIssuesCount || 0} issues
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditMember(member);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                  title="Edit Member"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteMember(member.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete Member"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No members in this body</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Building className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                  <p>No bodies found</p>
                  <p className="text-sm">Bodies will appear here when created</p>
                </div>
              )}

              {/* Unassigned Members */}
              {data.unassignedMembers.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Unassigned Members ({data.unassignedMembers.length})
                  </h4>
                  <div className="space-y-2">
                    {data.unassignedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center space-x-3 p-2 bg-white rounded border"
                      >
                        <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {member.name}
                          </p>
                          <p className="text-xs text-gray-600">{member.email}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onEditMember(member)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Member"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onDeleteMember(member.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HierarchyTreeView;
