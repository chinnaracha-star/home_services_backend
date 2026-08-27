# 🔄 API Migration Guide

## Breaking Changes - Update Your Frontend!

The API routes have been reorganized for better structure and security. **You must update all API calls in your frontend application.**

---

## 📋 Quick Reference - Old vs New URLs

### Promotion Endpoints
| Old URL | New URL | Auth Changed |
|---------|---------|--------------|
| `GET /promotion` | `GET /api/promotions` | No change (still public) |
| `PUT /updatepromotion/:id` | `PUT /api/promotions/:id/quota` | ⚠️ **Now requires auth token** |

### Payment Endpoints
| Old URL | New URL | Auth Changed |
|---------|---------|--------------|
| `POST /create-payment-intent` | `POST /api/payments/intent` | ⚠️ **Now requires auth token** |
| `GET /payment-status/:id` | `GET /api/payments/status/:id` | ⚠️ **Now requires auth token** |

### Address Endpoints
| Old URL | New URL | Auth Changed |
|---------|---------|--------------|
| `GET /provinces` | `GET /api/provinces` | No change (still public) |
| `GET /districts` | `GET /api/districts` | No change (still public) |
| `GET /subdistricts` | `GET /api/subdistricts` | No change (still public) |
| `GET /provinces/:id/districts` | `GET /api/provinces/:id/districts` | No change (still public) |
| `GET /districts/:id/subdistricts` | `GET /api/districts/:id/subdistricts` | No change (still public) |

---

## 🔧 Frontend Code Updates

### Example 1: Fetching Promotions (No Auth)

**Before:**
```javascript
const response = await fetch('http://localhost:3001/promotion');
```

**After:**
```javascript
const response = await fetch('http://localhost:3001/api/promotions');
```

---

### Example 2: Updating Promotion Quota (Now Requires Auth!)

**Before:**
```javascript
const response = await fetch(`http://localhost:3001/updatepromotion/${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ quota: newQuota })
});
```

**After:**
```javascript
const token = localStorage.getItem('authToken'); // or however you store your token

const response = await fetch(`http://localhost:3001/api/promotions/${id}/quota`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // ⚠️ Auth token now required!
  },
  body: JSON.stringify({ quota: newQuota })
});
```

---

### Example 3: Creating Payment Intent (Now Requires Auth!)

**Before:**
```javascript
const response = await fetch('http://localhost:3001/create-payment-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ amount: 1000 })
});
```

**After:**
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3001/api/payments/intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // ⚠️ Auth token now required!
  },
  body: JSON.stringify({ amount: 1000 })
});
```

---

### Example 4: Fetching Provinces

**Before:**
```javascript
const response = await fetch('http://localhost:3001/provinces');
```

**After:**
```javascript
const response = await fetch('http://localhost:3001/api/provinces');
```

---

## 🔐 Authentication Requirements

### Endpoints That NOW Require Authentication:
1. `PUT /api/promotions/:id/quota`
2. `POST /api/payments/intent`
3. `GET /api/payments/status/:paymentIntentId`

**All requests to these endpoints must include:**
```javascript
headers: {
  'Authorization': `Bearer ${yourAuthToken}`
}
```

### Endpoints That Remain Public (No Auth):
- `GET /api/promotions` - Browse promotions
- `GET /api/provinces` - Get provinces
- `GET /api/districts` - Get districts
- `GET /api/subdistricts` - Get subdistricts
- `GET /api/categories` - Browse categories
- `GET /api/services` - Browse services

---

## 🧪 Testing Your Changes

### 1. Test Public Endpoints (No Token Needed)
```bash
# Should work without auth
curl http://localhost:3001/api/promotions
curl http://localhost:3001/api/provinces
```

### 2. Test Protected Endpoints (Token Required)
```bash
# Should return 401 Unauthorized without token
curl http://localhost:3001/api/promotions/1/quota \
  -X PUT \
  -H "Content-Type: application/json" \
  -d '{"quota": 100}'

# Should work with valid token
curl http://localhost:3001/api/promotions/1/quota \
  -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"quota": 100}'
```

---

## 📱 React/Next.js Helper Function

Create a reusable API client:

```javascript
// utils/api.js
const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  // GET request
  get: async (endpoint, requiresAuth = false) => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    return response.json();
  },

  // POST request
  post: async (endpoint, data, requiresAuth = false) => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    return response.json();
  },

  // PUT request
  put: async (endpoint, data, requiresAuth = false) => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return response.json();
  },
};

// Usage examples:
// const promotions = await api.get('/promotions'); // Public
// const payment = await api.post('/payments/intent', { amount: 1000 }, true); // Protected
// const updated = await api.put('/promotions/1/quota', { quota: 50 }, true); // Protected
```

---

## ⚠️ Common Errors After Migration

### 404 Not Found
**Cause:** Still using old endpoint URLs  
**Fix:** Update to new `/api/*` prefixed URLs

### 401 Unauthorized
**Cause:** Missing or invalid auth token on protected endpoints  
**Fix:** Ensure token is included in Authorization header

### CORS Issues
**Cause:** Frontend origin not whitelisted  
**Fix:** Backend already configured for `localhost:3000` and `127.0.0.1:3000`

---

## ✅ Migration Checklist

- [ ] Update all promotion endpoint URLs
- [ ] Update all payment endpoint URLs
- [ ] Update all address endpoint URLs
- [ ] Add auth tokens to promotion quota updates
- [ ] Add auth tokens to payment endpoints
- [ ] Test all endpoints after migration
- [ ] Update API documentation in frontend
- [ ] Inform team members of changes

---

## 🆘 Need Help?

If you encounter issues:
1. Check the console for error messages
2. Verify the endpoint URL matches `API_ENDPOINTS.md`
3. For protected endpoints, confirm token is being sent
4. Check network tab to see actual request/response

---

## 📚 Additional Resources

- See `API_ENDPOINTS.md` for complete endpoint reference
- Backend now has clear route organization in `src/app.mjs`
- All changes are backward incompatible - full migration required
