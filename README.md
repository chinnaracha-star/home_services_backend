# home_services_backend

Backend API ของ Home Services ใช้ Express, `pg` และ Raw SQL ต่อ Supabase PostgreSQL

## Setup

1. คัดลอก `.env.example` เป็น `.env`
2. ใส่ `DATABASE_URL` จาก Supabase (Connection string)
3. ติดตั้งแพ็กเกจแล้วทดสอบการเชื่อมต่อ

```bash
npm install
npm run db:ping
npm run dev
```

Health check: [http://localhost:3001/health](http://localhost:3001/health)

อย่า commit ไฟล์ `.env`
