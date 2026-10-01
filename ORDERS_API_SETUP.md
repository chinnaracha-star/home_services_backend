# 📦 Orders API Setup & Testing Guide

## 🔍 Issues Fixed

1. **✅ Missing `/` in route mount** - Fixed `app.use("api/orders"` to `app.use("/api/orders"`
2. **✅ Missing database imports** - Added `pool` import to repository
3. **✅ Variable declaration errors** - Fixed `assignData` declarations
4. **✅ Missing user_id in query** - Added user_id to INSERT statement
5. **✅ Table name issues** - Changed `order` to `orders` (avoiding SQL reserved keyword)
6. **✅ Orders table missing** - Created complete database schema
7. **✅ Promotion code lookup** - Added logic to convert promotion code to ID
8. **✅ Better error handling** - Added validation and detailed error messages

---

## 📊 Database Setup

### Step 1: Run the Migration

You need to create the `orders` and `order_items` tables in your database.

**Option A: Use the main schema file**
```bash
# In your backend directory
npm run migrate
```

**Option B: Run the SQL manually**

Connect to your PostgreSQL database and run:
```bash
psql -U your_username -d your_database -f src/database/schema.sql
```

Or use a database client (pgAdmin, DBeaver, etc.) and execute the SQL from `src/database/schema.sql`

### Step 2: Verify Tables Created

Run this query in your database:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'order_items');
```

You should see both tables listed.

---

## 🧪 Testing the API

### Test 1: Create an Order (Your Original Request)

**Endpoint:** `POST http://localhost:3001/api/orders`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
    "userId": 1,
    "serviceId": 2,
    "status": "pending",
    "totAmount": 250,
    "serviceDate": "2026-08-25",
    "serviceTime": "16:18:00",
    "adress": "11/12",
    "province": "สมุทรปราการ",
    "district": "บางพลี",
    "subdistrict": "บางใหญ่",
    "information": "ไม่มี",
    "promotionCode": "HOME2012",
    "discount": 50
}
```

**Expected Response (201 Created):**
```json
{
    "message": "Order created successfully",
    "data": {
        "order_id": 1,
        "user_id": 1,
        "service_id": 2,
        "status": "pending",
        "total_price": "250.00",
        "schedule_date": "2026-08-25",
        "schedule_time": "16:18:00",
        "address": "11/12",
        "province": "สมุทรปราการ",
        "district": "บางพลี",
        "subdistrict": "บางใหญ่",
        "additional_info": "ไม่มี",
        "promotion_id": 1,
        "discount": "50.00",
        "created_at": "2026-08-24T...",
        "updated_at": "2026-08-24T..."
    }
}
```

---

### Test 2: Create Order Without Promotion

**Body:**
```json
{
    "userId": 1,
    "serviceId": 2,
    "status": "pending",
    "totAmount": 300,
    "serviceDate": "2026-08-26",
    "serviceTime": "10:00:00",
    "adress": "123 Main St",
    "province": "กรุงเทพมหานคร",
    "district": "ป้อมปราบศัตรูพ่าย",
    "subdistrict": "วัดเทพศิรินทร์"
}
```

---

### Test 3: Missing Required Fields (Validation Test)

**Body:**
```json
{
    "userId": 1,
    "serviceId": 2
}
```

**Expected Response (400 Bad Request):**
```json
{
    "message": "Missing required fields",
    "code": "MISSING_FIELDS",
    "errors": [
        { "field": "status", "message": "status is required" },
        { "field": "totAmount", "message": "totAmount is required" },
        { "field": "serviceDate", "message": "serviceDate is required" },
        { "field": "serviceTime", "message": "serviceTime is required" },
        { "field": "adress", "message": "adress is required" },
        { "field": "province", "message": "province is required" },
        { "field": "district", "message": "district is required" },
        { "field": "subdistrict", "message": "subdistrict is required" }
    ]
}
```

---

## 📝 Postman Collection

### Create Order Request

```
Method: POST
URL: http://localhost:3001/api/orders
Headers:
  Content-Type: application/json
Body (raw JSON):
{
    "userId": 1,
    "serviceId": 2,
    "status": "pending",
    "totAmount": 250,
    "serviceDate": "2026-08-25",
    "serviceTime": "16:18:00",
    "adress": "11/12",
    "province": "สมุทรปราการ",
    "district": "บางพลี",
    "subdistrict": "บางใหญ่",
    "information": "ไม่มี",
    "promotionCode": "HOME2012",
    "discount": 50
}
```

---

## 🔍 Troubleshooting

### Error: "relation 'orders' does not exist"

**Solution:** Run the database migration
```bash
npm run migrate
```

Or manually execute the SQL from `src/database/schema.sql`

---

### Error: "column 'user_id' does not exist"

**Solution:** Your users table might use `id` instead of `user_id`. Check your users table structure:
```sql
\d users
```

If it uses `id`, update the foreign key constraint in the schema.

---

### Error: "promotion_id violates foreign key constraint"

**Solution:** The promotion code "HOME2012" doesn't exist in your database. Either:

1. **Remove promotion from request:**
   ```json
   {
       "userId": 1,
       "serviceId": 2,
       ...
       // Don't include promotionCode
   }
   ```

2. **Or create the promotion first:**
   ```bash
   curl -X POST http://localhost:3001/api/admin/promotions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -d '{
       "promotion_code": "HOME2012",
       "status": "active",
       "quota": 100,
       "type": "fixed",
       "discount": 50,
       "expire": "2027-12-31T23:59:59Z"
     }'
   ```

---

### Error: "user_id violates foreign key constraint"

**Solution:** User with ID 1 doesn't exist. Either:

1. **Use an existing user ID** - Check your database:
   ```sql
   SELECT user_id FROM users LIMIT 5;
   ```

2. **Or create a test user** using your registration endpoint

---

### Error: "service_id violates foreign key constraint"

**Solution:** Service with ID 2 doesn't exist. Check available services:
```sql
SELECT service_id, name FROM services;
```

---

## 🗄️ Database Schema Reference

### Orders Table
```sql
Column           | Type         | Description
-----------------|--------------|---------------------------
order_id         | BIGINT       | Primary key (auto-increment)
user_id          | BIGINT       | Foreign key to users
service_id       | BIGINT       | Foreign key to services
status           | VARCHAR(50)  | pending, confirmed, in_progress, completed, cancelled
total_price      | NUMERIC      | Total order price
schedule_date    | DATE         | Service date
schedule_time    | TIME         | Service time
address          | TEXT         | Full address
province         | VARCHAR(255) | Province name
district         | VARCHAR(255) | District name
subdistrict      | VARCHAR(255) | Subdistrict name
additional_info  | TEXT         | Extra information (nullable)
promotion_id     | BIGINT       | Foreign key to promotions (nullable)
discount         | NUMERIC      | Discount amount
created_at       | TIMESTAMPTZ  | Creation timestamp
updated_at       | TIMESTAMPTZ  | Last update timestamp
```

### Order Items Table
```sql
Column          | Type    | Description
----------------|---------|---------------------------
order_item_id   | BIGINT  | Primary key (auto-increment)
order_id        | BIGINT  | Foreign key to orders
option_id       | BIGINT  | Service option ID
quantity        | INTEGER | Quantity ordered
unit_price      | NUMERIC | Price per unit
created_at      | TIMESTAMPTZ | Creation timestamp
```

---

## 📊 Sample Data for Testing

### Prerequisites
Make sure you have:
1. A user with ID = 1
2. A service with ID = 2
3. A promotion with code = "HOME2012" (optional)

### Check Prerequisites
```sql
-- Check users
SELECT user_id, email FROM users LIMIT 5;

-- Check services
SELECT service_id, name FROM services LIMIT 5;

-- Check promotions
SELECT promotion_id, promotion_code FROM promotions WHERE status = 'active';
```

---

## 🚀 Quick Start

1. **Start your backend**
   ```bash
   npm start
   ```

2. **Run database migration**
   ```bash
   npm run migrate
   ```

3. **Test the endpoint**
   ```bash
   curl -X POST http://localhost:3001/api/orders \
     -H "Content-Type: application/json" \
     -d '{
       "userId": 1,
       "serviceId": 2,
       "status": "pending",
       "totAmount": 250,
       "serviceDate": "2026-08-25",
       "serviceTime": "16:18:00",
       "adress": "11/12",
       "province": "สมุทรปราการ",
       "district": "บางพลี",
       "subdistrict": "บางใหญ่"
     }'
   ```

---

## ✅ Checklist

- [ ] Database migration completed
- [ ] Orders and order_items tables created
- [ ] Backend server running
- [ ] Test user exists in database
- [ ] Test service exists in database
- [ ] POST /api/orders returns 201 Created
- [ ] Order data saved correctly in database
- [ ] Validation working for missing fields
- [ ] Promotion code lookup working (optional)

---

## 📚 Related Documentation

- `API_ENDPOINTS.md` - Complete API reference
- `MIGRATION_GUIDE.md` - Frontend migration guide
- `src/database/schema.sql` - Full database schema

---

## 🆘 Still Having Issues?

1. Check server logs for detailed error messages
2. Verify database connection in `.env` file
3. Ensure all required tables exist
4. Check foreign key constraints are satisfied
5. Verify user/service/promotion IDs exist in database
