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
  Star,
} from 'lucide-react';

const HierarchyTreeView = ({ data, onEditMember, onDeleteMember }) => {
  const [expandedItems, setExpandedItems] = useState({
    mla: true,
    bodies: {},
  });

  const toggleExpanded = (type, id = null) => {
    if (type === 'mla') {
      setExpandedItems((prev) => ({
        ...prev,
        mla: !prev.mla,
      }));
    } else if (type === 'body') {
      setExpandedItems((prev) => ({
        ...prev,
        bodies: {
          ...prev.bodies,
          [id]: !prev.bodies[id],
        },
      }));
    }
  };

  const getMemberStatusColor = (member) => {
    if (!member.isActive) return 'bg-red-100 text-red-800 border-red-200';
    if (member.assignedIssuesCount > 0)
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (!data) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 p-4 sm:p-6">
        <div className="text-center py-8 text-gray-500">
          <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Loading hierarchy data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-primary/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
              Organizational Hierarchy
            </h2>
            <p className="text-xs sm:text-sm text-primary/80">
              MLA → Constituencies → Members structure
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* MLA Level */}
        <div className="mb-6">
          <div
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => toggleExpanded('mla')}
          >
            {expandedItems.mla ? (
              <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
            )}
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow flex-shrink-0">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                {data.mla.name}
              </h3>
              <p className="text-xs sm:text-sm text-primary/80 truncate">
                {data.mla.email}
              </p>
              <div className="flex gap-1 sm:gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                  MLA
                </span>
                {data.mla.isAdmin && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                    Admin
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs sm:text-sm font-semibold text-gray-900">
                {data.mla.totalMembers} Members
              </p>
              <p className="text-xs text-primary/80">
                {data.bodies.length} Constituencies
              </p>
            </div>
          </div>

          {/* Bodies Level */}
          {expandedItems.mla && (
            <div className="ml-4 sm:ml-12 mt-4 space-y-4">
              {data.bodies.length > 0 ? (
                data.bodies.map((body) => (
                  <div key={body.id} className="space-y-4">
                    <div
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 cursor-pointer hover:shadow-md transition-all duration-200"
                      onClick={() => toggleExpanded('body', body.id)}
                    >
                      {expandedItems.bodies[body.id] ? (
                        <ChevronDown className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                      <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center shadow flex-shrink-0">
                        <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {body.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {body.type.replace(/_/g, ' ')} • {body.code}
                        </p>
                        {body.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 hidden sm:block">
                            {body.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {body.memberCount} Members
                        </p>
                        {body.state && (
                          <p className="text-xs text-primary/80 truncate">
                            {body.state.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Members Level */}
                    {expandedItems.bodies[body.id] && (
                      <div className="ml-4 sm:ml-12 mt-3 space-y-3">
                        {body.members.length > 0 ? (
                          body.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10 hover:shadow-md transition-all duration-200"
                            >
                              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center shadow flex-shrink-0">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                    {member.name}
                                  </h5>
                                  {member.isPinned && (
                                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-200 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                  {member.designation || 'Member'}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                  <div className="flex items-center text-xs text-gray-500">
                                    <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">
                                      {member.email}
                                    </span>
                                  </div>
                                  {member.phone && (
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">
                                        {member.phone}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                <div className="text-right space-y-1">
                                  <span
                                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getMemberStatusColor(member)}`}
                                  >
                                    {member.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    {member.assignedIssuesCount || 0} issues
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditMember(member);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-primary rounded-full hover:bg-primary/10 transition-colors"
                                    title="Edit Member"
                                  >
                                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteMember(member.id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors"
                                    title="Delete Member"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500 bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10">
                            <User className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-gray-400" />
                            <p className="text-sm">No members in this body</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 bg-white/80 backdrop-blur-sm rounded-xl shadow border border-primary/10">
                  <Building className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">No Constituencies found</p>
                  <p className="text-xs sm:text-sm mt-1">
                    Constituencies will appear here when created
                  </p>
                </div>
              )}

              {/* Unassigned Members */}
              {data.unassignedMembers.length > 0 && (
                <div className="mt-6 p-4 sm:p-5 bg-yellow-50/80 backdrop-blur-sm rounded-xl shadow border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
                    <span>
                      Unassigned Members ({data.unassignedMembers.length})
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {data.unassignedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-yellow-200/50"
                      >
                        <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 truncate text-sm">
                            {member.name}
                          </h5>
                          <p className="text-xs text-gray-600 truncate">
                            {member.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditMember(member)}
                            className="p-1 text-gray-400 hover:text-primary rounded-full hover:bg-primary/10 transition-colors"
                            title="Edit Member"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onDeleteMember(member.id)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors"
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
