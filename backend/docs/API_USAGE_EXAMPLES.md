# API Usage Examples

This document provides practical examples of how to use the enhanced authentication API endpoints.

## Authentication Headers

All authenticated requests require a Bearer token in the Authorization header:

```javascript
const headers = {
  Authorization: 'Bearer your_jwt_token_here',
  'Content-Type': 'application/json',
};
```

## Profile Management Examples

### Get User Profile

```javascript
// GET /auth/profile
const response = await fetch('/auth/profile', {
  method: 'GET',
  headers: headers,
});

const data = await response.json();
console.log('User profile:', data.user);
```

### Update Profile

```javascript
// PUT /auth/profile
const updateData = {
  name: 'Updated Name',
  phone: '+919876543210',
  stateId: 'state_123',
  districtId: 'district_456',
};

const response = await fetch('/auth/profile', {
  method: 'PUT',
  headers: headers,
  body: JSON.stringify(updateData),
});

const result = await response.json();
console.log('Profile updated:', result.message);
```

### Change Password

```javascript
// POST /auth/change-password
const passwordData = {
  currentPassword: 'oldPassword123',
  newPassword: 'NewSecurePass@123',
};

const response = await fetch('/auth/change-password', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(passwordData),
});
```

### Update Location

```javascript
// POST /auth/update-location
const locationData = {
  latitude: 28.6139,
  longitude: 77.209,
  address: 'New Delhi, India',
};

const response = await fetch('/auth/update-location', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(locationData),
});
```

## Subordinate Management Examples (MLA/Admin Only)

### Get Subordinates List

```javascript
// GET /auth/subordinates?page=1&limit=10&type=DIRECT
const response = await fetch('/auth/subordinates?page=1&limit=10&type=DIRECT', {
  method: 'GET',
  headers: headers,
});

const data = await response.json();
console.log('Subordinates:', data.subordinates);
console.log('Pagination:', data.pagination);
```

### Add New Subordinate

```javascript
// POST /auth/subordinates
const subordinateData = {
  subordinateId: 'user_123',
  type: 'DIRECT',
  designation: 'Shakti Kendra Head',
  permissions: ['manage_issues', 'view_reports'],
  shaktiKendraId: 'sk_456',
  localBodyId: 'lb_789',
};

const response = await fetch('/auth/subordinates', {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(subordinateData),
});

const result = await response.json();
console.log('Subordinate added:', result.subordinateRelation);
```

### Update Subordinate

```javascript
// PUT /auth/subordinates/relation_id_123
const updateData = {
  type: 'INDIRECT',
  designation: 'Updated Position',
  isActive: true,
  permissions: ['view_reports', 'manage_local_issues'],
};

const response = await fetch('/auth/subordinates/relation_id_123', {
  method: 'PUT',
  headers: headers,
  body: JSON.stringify(updateData),
});
```

### Get Subordinate Hierarchy

```javascript
// GET /auth/subordinates/hierarchy
const response = await fetch('/auth/subordinates/hierarchy', {
  method: 'GET',
  headers: headers,
});

const data = await response.json();
console.log('Hierarchy:', data.hierarchy);
```

## Admin Management Examples (Admin Only)

### Get All Users

```javascript
// GET /auth/users?page=1&limit=10&role=MLA&search=john
const params = new URLSearchParams({
  page: '1',
  limit: '10',
  role: 'MLA',
  search: 'john',
  isActive: 'true',
});

const response = await fetch(`/auth/users?${params}`, {
  method: 'GET',
  headers: headers,
});

const data = await response.json();
console.log('Users:', data.users);
```

### Get Specific User

```javascript
// GET /auth/users/user_id_123
const response = await fetch('/auth/users/user_id_123', {
  method: 'GET',
  headers: headers,
});

const data = await response.json();
console.log('User details:', data.user);
```

### Update User

```javascript
// PUT /auth/users/user_id_123
const userData = {
  name: 'Updated User Name',
  role: 'MLA',
  isActive: true,
  stateId: 'state_456',
  constituencyId: 'const_789',
};

const response = await fetch('/auth/users/user_id_123', {
  method: 'PUT',
  headers: headers,
  body: JSON.stringify(userData),
});
```

### Activate/Deactivate User

```javascript
// POST /auth/users/user_id_123/activate
const activateResponse = await fetch('/auth/users/user_id_123/activate', {
  method: 'POST',
  headers: headers,
});

// POST /auth/users/user_id_123/deactivate
const deactivateResponse = await fetch('/auth/users/user_id_123/deactivate', {
  method: 'POST',
  headers: headers,
});
```

## Location Data Examples (Public Access)

### Get States

```javascript
// GET /auth/locations/states
const response = await fetch('/auth/locations/states');
const data = await response.json();
console.log('States:', data.states);
```

### Get Districts by State

```javascript
// GET /auth/locations/districts/state_id_123
const response = await fetch('/auth/locations/districts/state_id_123');
const data = await response.json();
console.log('Districts:', data.districts);
```

### Get Constituencies by District

```javascript
// GET /auth/locations/constituencies/district_id_456
const response = await fetch('/auth/locations/constituencies/district_id_456');
const data = await response.json();
console.log('Constituencies:', data.constituencies);
```

### Get Complete Location Hierarchy

```javascript
// Function to get complete location hierarchy
async function getLocationHierarchy(stateId) {
  try {
    // Get state info
    const statesResponse = await fetch('/auth/locations/states');
    const statesData = await statesResponse.json();
    const state = statesData.states.find((s) => s.id === stateId);

    // Get districts
    const districtsResponse = await fetch(
      `/auth/locations/districts/${stateId}`
    );
    const districtsData = await districtsResponse.json();

    // Get constituencies for first district (example)
    if (districtsData.districts.length > 0) {
      const districtId = districtsData.districts[0].id;
      const constituenciesResponse = await fetch(
        `/auth/locations/constituencies/${districtId}`
      );
      const constituenciesData = await constituenciesResponse.json();

      console.log('Complete hierarchy:', {
        state,
        districts: districtsData.districts,
        constituencies: constituenciesData.constituencies,
      });
    }
  } catch (error) {
    console.error('Error fetching location hierarchy:', error);
  }
}
```

## Real-time Location Tracking Example

```javascript
// Function to track and update user location
function trackUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Current Location', // You can use reverse geocoding to get address
        };

        try {
          const response = await fetch('/auth/update-location', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(locationData),
          });

          if (response.ok) {
            console.log('Location updated successfully');
          }
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  }
}

// Call this function to track location
trackUserLocation();
```

## Error Handling Example

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types
      switch (response.status) {
        case 401:
          console.error('Unauthorized - please login again');
          // Redirect to login page
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 429:
          console.error('Rate limit exceeded - please try again later');
          break;
        default:
          console.error('API Error:', data.error);
      }
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

// Usage example with error handling
try {
  const profileData = await makeAuthenticatedRequest('/auth/profile');
  console.log('Profile loaded:', profileData.user);
} catch (error) {
  console.log('Failed to load profile:', error.message);
}
```

## React Hook Example

```javascript
// Custom hook for managing user profile
import { useState, useEffect } from 'react';

function useUserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/auth/profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updateData) => {
    try {
      const response = await fetch('/auth/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchProfile(); // Refresh profile data
        return true;
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return { profile, loading, error, updateProfile, fetchProfile };
}

// Usage in React component
function ProfileComponent() {
  const { profile, loading, error, updateProfile } = useUserProfile();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Welcome, {profile?.name}</h1>
      <p>Role: {profile?.role}</p>
      <p>Location: {profile?.currentAddress}</p>
      {/* Add update form here */}
    </div>
  );
}
```

## Notes

1. **Rate Limiting**: Be aware of rate limits (500 requests per 15 minutes for auth endpoints, 100 for location endpoints)
2. **Error Handling**: Always implement proper error handling for better user experience
3. **Token Management**: Store JWT tokens securely and handle token expiration
4. **Location Privacy**: Only request location permission when necessary and inform users about usage
5. **Role-based UI**: Show/hide features based on user roles (MLA, Admin, etc.)
6. **Real-time Updates**: Consider implementing WebSocket connections for real-time subordinate location tracking
