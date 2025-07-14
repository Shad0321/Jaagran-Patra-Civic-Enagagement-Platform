import React from 'react';

// Navigation items based on user roles
export const getNavigationItems = (userRole) => {
  const commonItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'home',
      roles: ['CITIZEN', 'MEMBER', 'MLA', 'ADMIN'],
    },
    {
      id: 'election-map',
      label: 'Election Map',
      path: '/election-map',
      icon: 'globe',
      roles: ['CITIZEN', 'MEMBER', 'MLA', 'ADMIN'],
    },
    {
      id: 'nearby-issues',
      label: 'Nearby Issues',
      path: '/nearby-issues',
      icon: 'map-pin',
      roles: ['CITIZEN', 'MEMBER', 'MLA', 'ADMIN'],
    },
  ];

  const roleBasedItems = {
    CITIZEN: [
      {
        id: 'my-issues',
        label: 'My Issues',
        path: '/issues',
        icon: 'flag',
        roles: ['CITIZEN'],
      },
      {
        id: 'news',
        label: 'News & Updates',
        path: '/news',
        icon: 'newspaper',
        roles: ['CITIZEN'],
      },
    ],
    MEMBER: [
      {
        id: 'assigned-issues',
        label: 'Assigned Issues',
        path: '/issues',
        icon: 'clipboard',
        roles: ['MEMBER'],
      },
      {
        id: 'citizens',
        label: 'Citizens',
        path: '/citizens',
        icon: 'users',
        roles: ['MEMBER'],
      },
      {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        icon: 'chart',
        roles: ['MEMBER'],
      },
    ],
    MLA: [
      {
        id: 'issues-overview',
        label: 'Issues Overview',
        path: '/issues',
        icon: 'clipboard',
        roles: ['MLA'],
      },
      {
        id: 'members',
        label: 'Manage Members',
        path: '/member-management',
        icon: 'users',
        roles: ['MLA'],
      },
      {
        id: 'constituency',
        label: 'Constituency',
        path: '/body-management',
        icon: 'map',
        roles: ['MLA'],
      },
      {
        id: 'issue-assignment',
        label: 'Issue Assignment',
        path: '/issue-assignment',
        icon: 'user-check',
        roles: ['MLA'],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/analytics',
        icon: 'chart',
        roles: ['MLA'],
      },
    ],
    ADMIN: [
      {
        id: 'all-issues',
        label: 'All Issues',
        path: '/admin/issues',
        icon: 'clipboard',
        roles: ['ADMIN'],
      },
      {
        id: 'user-management',
        label: 'User Management',
        path: '/admin/users',
        icon: 'users',
        roles: ['ADMIN'],
      },
      {
        id: 'mla-management',
        label: 'MLA Management',
        path: '/admin/mlas',
        icon: 'crown',
        roles: ['ADMIN'],
      },
      {
        id: 'system-settings',
        label: 'System Settings',
        path: '/admin/settings',
        icon: 'settings',
        roles: ['ADMIN'],
      },
      {
        id: 'analytics-reports',
        label: 'Analytics & Reports',
        path: '/admin/analytics',
        icon: 'chart',
        roles: ['ADMIN'],
      },
    ],
  };

  const items = [...commonItems];

  if (roleBasedItems[userRole]) {
    items.push(...roleBasedItems[userRole]);
  }

  // Add notification item for all roles
  items.push({
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: 'bell',
    roles: ['CITIZEN', 'MEMBER', 'MLA', 'ADMIN'],
  });

  return items.filter((item) => item.roles.includes(userRole));
};

// SVG icons for navigation items
export const getIcon = (iconName) => {
  const icons = {
    home: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    flag: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    plus: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    ),
    clipboard: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      </svg>
    ),
    users: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    chart: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v18h18" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
      </svg>
    ),
    map: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
    crown: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm0 16h20" />
      </svg>
    ),
    settings: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    bell: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    ),
    newspaper: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" />
        <path d="M15 18h-5" />
        <path d="M10 6h8v4h-8V6Z" />
      </svg>
    ),
    'map-pin': (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    globe: (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    ),
    'user-check': (
      <svg
        className="size-4"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    ),
  };

  return icons[iconName] || icons.home;
};
