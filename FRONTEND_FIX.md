# 🔴 Frontend 404 Error Fix Guide

## Problem
Your frontend (`hero-section-3.tsx` line 62) is getting a **404 Not Found** error when calling the promotion endpoint.

## Root Cause
The frontend is still using the **OLD** endpoint URL, but the backend has been updated to use **NEW** URLs.

---

## 🔍 Identifying the Issue

Based on the error at `hero-section-3.tsx:62`, your code is likely calling one of these old endpoints:

### Most Likely Culprits:
```typescript
// ❌ OLD - Returns 404
fetch('http://localhost:3001/promotion')
fetch('http://localhost:3001/updatepromotion/123')

// ✅ NEW - Works
fetch('http://localhost:3001/api/promotions')
fetch('http://localhost:3001/api/promotions/123/quota')
```

---

## 🛠️ Solution: Update Frontend Code

### Step 1: Locate the File
File: `src/components/service-details/hero-section-3.tsx` (line ~62)

### Step 2: Find the Old Endpoint Call

Look for code similar to:
```typescript
const response = await fetch(`http://localhost:3001/promotion`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
});

if (!response.ok) {
  throw new Error(`Request failed with status ${response.status}`);
}
```

### Step 3: Replace With New Endpoint

```typescript
const response = await fetch(`http://localhost:3001/api/promotions`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
});

if (!response.ok) {
  throw new Error(`Request failed with status ${response.status}`);
}
```

---

## 📋 Complete URL Mapping Reference

### Promotion Endpoints
| Old URL (404) | New URL (✅ Works) | Auth Required |
|---------------|-------------------|---------------|
| `GET /promotion` | `GET /api/promotions` | ❌ No |
| `PUT /updatepromotion/:id` | `PUT /api/promotions/:id/quota` | ✅ Yes |

### Payment Endpoints
| Old URL (404) | New URL (✅ Works) | Auth Required |
|---------------|-------------------|---------------|
| `POST /create-payment-intent` | `POST /api/payments/intent` | ✅ Yes |
| `GET /payment-status/:id` | `GET /api/payments/status/:id` | ✅ Yes |

### Address Endpoints
| Old URL (404) | New URL (✅ Works) | Auth Required |
|---------------|-------------------|---------------|
| `GET /provinces` | `GET /api/provinces` | ❌ No |
| `GET /districts` | `GET /api/districts` | ❌ No |
| `GET /subdistricts` | `GET /api/subdistricts` | ❌ No |

---

## 🎯 Common Patterns to Fix

### Pattern 1: Simple GET Request
```typescript
// ❌ BEFORE
const res = await fetch('http://localhost:3001/promotion');

// ✅ AFTER
const res = await fetch('http://localhost:3001/api/promotions');
```

### Pattern 2: PUT Request (Now Requires Auth!)
```typescript
// ❌ BEFORE
const res = await fetch(`http://localhost:3001/updatepromotion/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

// ✅ AFTER
const token = localStorage.getItem('authToken'); // Get your auth token

const res = await fetch(`http://localhost:3001/api/promotions/${id}/quota`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // ⚠️ Now required!
  },
  body: JSON.stringify(data)
});
```

### Pattern 3: Using Environment Variables (Recommended)
```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001

// In your component
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const res = await fetch(`${API_URL}/api/promotions`);
```

---

## 🧪 Testing Your Fix

### 1. Test in Browser Console
```javascript
// Open browser console (F12) and run:
fetch('http://localhost:3001/api/promotions')
  .then(res => res.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err));
```

### 2. Test with cURL
```bash
# Should return promotion data
curl http://localhost:3001/api/promotions
```

### 3. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Trigger the action that calls the API
4. Check the request URL - it should show `/api/promotions` not `/promotion`

---

## 🔍 How to Find All Instances to Update

If you're using VS Code or similar editor:

### Search for Old Endpoints
1. Press `Ctrl+Shift+F` (Windows) or `Cmd+Shift+F` (Mac)
2. Search for these patterns:
   ```
   /promotion
   /updatepromotion
   /create-payment-intent
   /payment-status
   localhost:3001/provinces
   localhost:3001/districts
   ```

3. Replace with:
   ```
   /api/promotions
   /api/promotions/${id}/quota
   /api/payments/intent
   /api/payments/status
   localhost:3001/api/provinces
   localhost:3001/api/districts
   ```

---

## 🚨 Important Notes

### Authentication Changes
Some endpoints now require authentication tokens:

```typescript
// Endpoints that NOW require tokens:
PUT /api/promotions/:id/quota
POST /api/payments/intent
GET /api/payments/status/:id

// Add this header to these requests:
headers: {
  'Authorization': `Bearer ${yourAuthToken}`
}
```

### Handle 401 Errors
```typescript
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (response.status === 401) {
  // Token expired or invalid
  // Redirect to login
  router.push('/login');
  return;
}

if (!response.ok) {
  throw new Error(`Request failed with status ${response.status}`);
}
```

---

## 📁 Example: Complete Fixed Component

```typescript
// src/components/service-details/hero-section-3.tsx

const handleClick = async () => {
  try {
    // ✅ NEW: Use correct endpoint
    const response = await fetch('http://localhost:3001/api/promotions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const result: PromotionResponse = await response.json();
    
    // Your success logic here
    console.log('Promotions:', result);
    
  } catch (error) {
    console.error('Error fetching promotions:', error);
    // Show error to user
  }
};
```

---

## ✅ Verification Checklist

After making changes:

- [ ] Updated all `/promotion` to `/api/promotions`
- [ ] Updated all `/updatepromotion/:id` to `/api/promotions/:id/quota`
- [ ] Added auth tokens to protected endpoints
- [ ] Updated environment variables if used
- [ ] Tested in browser - no 404 errors
- [ ] Checked Network tab - correct URLs are being called
- [ ] Error handling works for 401/404 responses

---

## 🆘 Still Getting 404?

### Debugging Steps:

1. **Check Backend is Running**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return health status

2. **Verify Exact URL**
   ```bash
   curl http://localhost:3001/api/promotions
   ```
   Should return promotion data

3. **Check for Typos**
   - `/api/promotion` ❌ (singular)
   - `/api/promotions` ✅ (plural)

4. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache in DevTools

5. **Check CORS**
   Backend is configured for:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   
   If your frontend runs on a different port, update `src/app.mjs`

---

## 📞 Need More Help?

1. Share the exact fetch/axios call from your code
2. Check the Network tab and share the actual URL being called
3. Verify backend is running: `npm start` in backend directory
4. Check backend logs for incoming requests

---

## 🔗 Related Documentation

- `API_ENDPOINTS.md` - Complete API reference
- `MIGRATION_GUIDE.md` - Detailed migration instructions
