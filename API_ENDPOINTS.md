# API Endpoints Documentation

## 🔍 Base URL
```
http://localhost:3001
```

---

## 1. Health Check
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ No | Server health status |

---

## 2. Authentication Routes

### User Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/user/register` | ❌ No | Register new user |
| POST | `/api/auth/user/login` | ❌ No | User login |
| POST | `/api/auth/user/logout` | ✅ Yes | User logout |

### Technician Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/technician/register` | ❌ No | Register new technician |
| POST | `/api/auth/technician/login` | ❌ No | Technician login |
| POST | `/api/auth/technician/logout` | ✅ Yes | Technician logout |

### General Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/me` | ✅ Yes | Get current user info |

---

## 3. Public API Routes (No Authentication Required)

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | ❌ No | Get all categories |
| GET | `/api/categories/:id` | ❌ No | Get category by ID |

### Services
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/services` | ❌ No | Get all services |
| GET | `/api/services/:id` | ❌ No | Get service by ID |

### Promotions (Public)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/promotions` | ❌ No | Get all active promotions |
| PUT | `/api/promotions/:id/quota` | ❌ No | Update promotion quota ⚠️ |

> ⚠️ **Security Warning**: The promotion quota update endpoint should be protected with authentication!

### Address Data (Provinces, Districts, Subdistricts)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/provinces` | ❌ No | Get all provinces |
| GET | `/api/districts` | ❌ No | Get all districts |
| GET | `/api/subdistricts` | ❌ No | Get all subdistricts |
| GET | `/api/provinces/:provinceId/districts` | ❌ No | Get districts by province |
| GET | `/api/districts/:districtId/subdistricts` | ❌ No | Get subdistricts by district |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/intent` | ✅ Yes | Create payment intent |
| GET | `/api/payments/status/:paymentIntentId` | ✅ Yes | Get payment status |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | ❌ No | Create new order ⚠️ |
| POST | `/api/orders/order-item` | ❌ No | Create order item ⚠️ |

> ⚠️ **Security Warning**: Order endpoints should be protected with authentication!

---

## 4. User Routes (Authentication Required)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/users` | ✅ Yes | User | Get all users |
| GET | `/api/users/:id` | ✅ Yes | User | Get user by ID |
| PATCH | `/api/users/:id` | ✅ Yes | User | Update user |
| DELETE | `/api/users/:id` | ✅ Yes | User | Delete user |

---

## 5. Technician Routes (Authentication Required)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/technicians` | ✅ Yes | Technician | Get all technicians |
| GET | `/api/technicians/:id` | ✅ Yes | Technician | Get technician by ID |
| PATCH | `/api/technicians/:id` | ✅ Yes | Technician | Update technician |
| DELETE | `/api/technicians/:id` | ✅ Yes | Technician | Delete technician |

---

## 6. Admin Routes (Admin Authentication Required)

### Admin - Categories
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/categories` | ✅ Yes | Admin | Get all categories |
| GET | `/api/admin/categories/:id` | ✅ Yes | Admin | Get category by ID |
| POST | `/api/admin/categories` | ✅ Yes | Admin | Create new category |
| PATCH | `/api/admin/categories/:id` | ✅ Yes | Admin | Update category |
| DELETE | `/api/admin/categories/:id` | ✅ Yes | Admin | Delete category |

### Admin - Services
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/services` | ✅ Yes | Admin | Get all services |
| GET | `/api/admin/services/:id` | ✅ Yes | Admin | Get service by ID |
| POST | `/api/admin/services` | ✅ Yes | Admin | Create new service |
| PATCH | `/api/admin/services/:id` | ✅ Yes | Admin | Update service |
| DELETE | `/api/admin/services/:id` | ✅ Yes | Admin | Delete service |

### Admin - Promotions
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/promotions` | ✅ Yes | Admin | Get all promotions |
| GET | `/api/admin/promotions/:id` | ✅ Yes | Admin | Get promotion by ID |
| POST | `/api/admin/promotions` | ✅ Yes | Admin | Create new promotion |
| PATCH | `/api/admin/promotions/:id` | ✅ Yes | Admin | Update promotion |
| DELETE | `/api/admin/promotions/:id` | ✅ Yes | Admin | Delete promotion |

---

## 🔐 Security Recommendations

### High Priority (Immediate Action Required)
1. **Add authentication to promotion quota update**
   ```javascript
   promotionRouter.put("/:id/quota", protect, updatePromotionQuotaController);
   ```

2. **Add authentication to payment endpoints**
   ```javascript
   paymentRouter.post("/intent", protect, createPaymentIntent);
   paymentRouter.get("/status/:paymentIntentId", protect, getPaymentStatus);
   ```

### Medium Priority
3. Consider rate limiting on public endpoints to prevent abuse
4. Add validation middleware to all routes
5. Implement CORS whitelist for production

---

## 📝 Changes Made (2024)

### Route Structure Improvements
✅ Removed duplicate admin promotion route (`/api/admin/promotion`)
✅ Removed duplicate user route (`/user`)
✅ Removed duplicate auth routes (kept only `/api/auth/*`)
✅ Moved all routes to consistent `/api/*` prefix
✅ Organized routes by logical grouping with clear sections

### Before vs After

| Before | After | Status |
|--------|-------|--------|
| `GET /promotion` | `GET /api/promotions` | ✅ Fixed |
| `PUT /updatepromotion/:id` | `PUT /api/promotions/:id/quota` | ✅ Fixed |
| `POST /create-payment-intent` | `POST /api/payments/intent` | ✅ Fixed |
| `GET /payment-status/:id` | `GET /api/payments/status/:id` | ✅ Fixed |
| `/api/admin/promotion` (duplicate) | Removed | ✅ Fixed |
| `/auth/*` (duplicate routes) | Consolidated to `/api/auth/*` | ✅ Fixed |

---

## 🧪 Testing Endpoints

### Test Public Promotion Endpoint
```bash
curl http://localhost:3001/api/promotions
```

### Test Admin Promotion Endpoint (requires auth token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/admin/promotions
```

### Test Address Endpoints
```bash
curl http://localhost:3001/api/provinces
curl http://localhost:3001/api/provinces/1/districts
```

---

## 📊 Route Conflict Resolution

All route conflicts have been resolved:
- ✅ No duplicate route mounts
- ✅ Clear separation between public and protected routes
- ✅ Consistent URL structure (`/api/*`)
- ✅ No overlapping paths at root level
- ✅ Logical grouping by feature and access level
