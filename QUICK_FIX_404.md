# 🚨 QUICK FIX: 404 Error in hero-section-3.tsx

## The Problem
```
Error at: src/components/service-details/hero-section-3.tsx:62
Message: Request failed with status 404
```

## The Cause
Your frontend is calling the **OLD endpoint URL** but the backend has been updated.

## The Solution (Copy & Paste)

### ❌ OLD CODE (Causing 404)
```typescript
const response = await fetch('http://localhost:3001/promotion', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
});
```

### ✅ NEW CODE (Fixed)
```typescript
const response = await fetch('http://localhost:3001/api/promotions', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
});
```

---

## 📝 What Changed

| Old Endpoint | New Endpoint | Status |
|--------------|--------------|--------|
| `/promotion` | `/api/promotions` | ✅ Just add `/api` prefix |
| `/updatepromotion/:id` | `/api/promotions/:id/quota` | ⚠️ Also requires auth token now |
| `/create-payment-intent` | `/api/payments/intent` | ⚠️ Also requires auth token now |
| `/provinces` | `/api/provinces` | ✅ Just add `/api` prefix |

---

## 🔍 How to Find and Fix

### Step 1: Search Your Frontend
Press `Ctrl+F` (or `Cmd+F` on Mac) in your editor and search for:
```
localhost:3001/promotion
```

### Step 2: Replace With
```
localhost:3001/api/promotions
```

### Step 3: Do the Same For Other Endpoints
- Search: `localhost:3001/updatepromotion`
- Replace: `localhost:3001/api/promotions` (and update path to `/:id/quota`)

- Search: `localhost:3001/create-payment-intent`
- Replace: `localhost:3001/api/payments/intent`

- Search: `localhost:3001/provinces`
- Replace: `localhost:3001/api/provinces`

---

## ⚡ Quick Test

Open your browser console (F12) and run:

```javascript
// Test if new endpoint works
fetch('http://localhost:3001/api/promotions')
  .then(res => res.json())
  .then(data => console.log('✅ Success:', data))
  .catch(err => console.error('❌ Error:', err));

// Test if old endpoint fails (should get 404)
fetch('http://localhost:3001/promotion')
  .then(res => console.log('Status:', res.status))
  .catch(err => console.error('Error:', err));
```

---

## 🎯 Full Example Fix

### Your File: `hero-section-3.tsx`

Find this code around line 62:
```typescript
const handleClick = async () => {
  try {
    // ❌ OLD - Change this line!
    const response = await fetch('http://localhost:3001/promotion', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const result: PromotionResponse = await response.json();
    // ... rest of your code
  } catch (error) {
    console.error(error);
  }
};
```

Replace with:
```typescript
const handleClick = async () => {
  try {
    // ✅ NEW - Fixed URL!
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
    // ... rest of your code
  } catch (error) {
    console.error(error);
  }
};
```

**That's it! Just change `/promotion` to `/api/promotions`**

---

## ✅ Verification

After making the change:

1. **Save the file**
2. **Refresh your browser** (hard refresh: Ctrl+Shift+R)
3. **Click the button** that triggers `handleClick`
4. **Check console** - no more 404 error!

---

## 🆘 Still Not Working?

### Check These:

1. **Backend is running?**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Backend updated?**
   Check that `home_services_backend/src/app.mjs` has:
   ```javascript
   app.use("/api/promotions", promotionRouter);
   ```

3. **Frontend dev server restarted?**
   Sometimes Next.js needs a restart:
   ```bash
   # In your frontend directory
   npm run dev
   ```

4. **Check the Network tab**
   - Open DevTools (F12)
   - Go to Network tab
   - Trigger the action
   - Look at the URL being called - should be `/api/promotions`

---

## 📞 More Detailed Help

If this quick fix doesn't solve it, check:
- `FRONTEND_FIX.md` - Comprehensive fix guide
- `MIGRATION_GUIDE.md` - Full migration instructions
- `API_ENDPOINTS.md` - Complete API reference
