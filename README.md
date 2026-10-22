# Vision Goals — by Zentyr

แอปตั้งเป้าหมายประจำปีแบบ self-hosted: วางเป้าหมาย แตกเป็นขั้นตอนย่อย และติดตามความคืบหน้าตลอดทั้งปี
ข้อมูลทั้งหมดเก็บอยู่ใน PostgreSQL บนเซิร์ฟเวอร์ของคุณเอง

## ฟีเจอร์

- **บัญชีผู้ใช้ของตัวเอง** — สมัคร/ล็อกอินด้วย username + password (scrypt hash, session cookie แบบ httpOnly, rate limit)
- **โหมดผู้เยี่ยมชม** — ใช้ได้โดยไม่ต้องสมัคร (เก็บใน browser) แล้วย้ายขึ้นบัญชีได้ในคลิกเดียว
- **เป้าหมายหลายปี** — สลับปีได้ ยกยอดเป้าหมายที่ยังไม่เสร็จไปปีถัดไป
- **ขั้นตอนย่อย** — ติ๊กทีละขั้น จัดลำดับได้ ครบทุกขั้นแล้วเป้าหมายสำเร็จอัตโนมัติ
- **Dashboard** — ความคืบหน้ารวม (รวมงานย่อย), เทียบกับเวลาของปีที่ผ่านไป (นำหน้า/ตามแผน/ช้ากว่า), สรุปตามหมวดหมู่, นับถอยหลังสิ้นปี
- **กำหนดเสร็จ** — แจ้ง “ใกล้ถึงกำหนด” และ “เลยกำหนด”
- **ค้นหา / กรอง / เรียงลำดับ** — ตามสถานะ หมวดหมู่ ความสำคัญ; มุมมองการ์ดหรือรายการ; ลากวางจัดลำดับ
- **ลบแล้วเลิกทำได้**, ทำสำเนาเป้าหมาย
- **โปสเตอร์แชร์** ขนาด IG Story (1080×1920) 4 ธีม
- **โหมดมืด/สว่าง/ตามระบบ**, คีย์ลัด (`N` เพิ่ม, `/` ค้นหา, `[` `]` เปลี่ยนปี, `?` ดูทั้งหมด), เปิด/ปิดเสียงเอฟเฟกต์
- **Export / Import JSON** ใช้ได้ทั้งบัญชีและโหมดผู้เยี่ยมชม (นำเข้าซ้ำได้ ระบบข้ามรายการซ้ำ)
- **โปรไฟล์** — ชื่อ, รูป (ครอปในเครื่อง), เปลี่ยนรหัสผ่าน (ออกจากระบบอุปกรณ์อื่นอัตโนมัติ)
- **Feedback** ส่งเข้า Discord (ซ่อนอัตโนมัติถ้าไม่ได้ตั้งค่า)
- PWA manifest, security headers, health check endpoint `/api/health`

## Tech stack

| ส่วน | เวอร์ชัน |
| --- | --- |
| Runtime | Node.js 24 LTS |
| Framework | Next.js 16.4 (App Router, standalone output) · React 19.3 |
| ภาษา / ตรวจโค้ด | TypeScript 6.0 · ESLint 10 |
| UI | Tailwind CSS 4.3 (CSS-first config) · Motion 14 · Radix UI · lucide-react 1.x · dnd-kit |
| Data | PostgreSQL 16 · Drizzle ORM 0.45 · Zod 4 |

```
src/
  app/            หน้าเว็บ + API routes (/api/auth, /api/goals, /api/profile, /api/health, /api/feedback)
  server/         โค้ดฝั่ง server เท่านั้น: db (schema, migrate), auth (session, password), http helpers
  lib/            โค้ดที่ใช้ร่วมกัน: types, validation (zod), goals logic, repositories (remote/local)
  hooks/          useGoals (optimistic updates + undo), useHotkeys, usePersistentState
  components/     ui (primitives), dashboard, goals, modals, auth, layout, effects
drizzle/          SQL migrations (รันอัตโนมัติตอน server เริ่ม)
```

## Deploy บน Coolify (Ubuntu)

1. Push repo นี้ขึ้น GitHub
2. ใน Coolify: **+ New Resource → Public/Private Repository (GitHub App)** → เลือก repo
3. Build Pack เลือก **Docker Compose** (ใช้ `docker-compose.yml` ที่มีให้ — มีทั้ง app และ PostgreSQL พร้อม volume)
4. แท็บ **Environment Variables** ตั้งค่าอย่างน้อย:

   | ตัวแปร | ค่า |
   | --- | --- |
   | `POSTGRES_PASSWORD` | รหัสผ่านยาว ๆ แบบสุ่ม (**จำเป็น**) |
   | `APP_URL` | เช่น `https://goals.yourdomain.com` |
   | `ALLOW_REGISTRATION` | `false` หลังสมัครบัญชีตัวเองเสร็จ ถ้าไม่อยากให้คนอื่นสมัคร |
   | `DISCORD_WEBHOOK_URL` | (ไม่บังคับ) สำหรับ Feedback |
   | `NEXT_PUBLIC_BRAND_URL` | (ไม่บังคับ) ลิงก์ของเครดิต Zentyr ที่ footer |

5. ตั้ง **Domain** ให้ service `app` (port `3000`) → Coolify จะออก SSL ให้อัตโนมัติ
6. กด **Deploy** — ตาราง database จะถูกสร้างอัตโนมัติตอนแอปเริ่มทำงาน

> **ทางเลือก:** ถ้าอยากให้ Coolify จัดการ PostgreSQL เอง (มีระบบ backup ในตัว) ให้สร้าง Database resource แยก
> แล้ว deploy แอปด้วย Build Pack **Dockerfile** พร้อมตั้ง `DATABASE_URL` ชี้ไปที่ database นั้น

### Backup

- ถ้าใช้ Coolify Database resource: เปิด Scheduled Backups ในหน้า database ได้เลย
- ถ้าใช้ `docker-compose.yml`: รัน `./scripts/backup.sh` บนเซิร์ฟเวอร์ (หรือตั้ง cron) จะได้ไฟล์ `.sql.gz` ใน `backups/`
- หรือกด **ส่งออกข้อมูล (JSON)** ในเมนูบัญชีของแอป

### ย้ายข้อมูลจาก Supabase เดิม

ดู [`scripts/import-supabase.md`](scripts/import-supabase.md)

## พัฒนาในเครื่อง

```bash
cp .env.example .env.local          # แก้ DATABASE_URL ให้ชี้ไป Postgres ในเครื่อง
docker run -d --name vg-db -p 5432:5432 -e POSTGRES_USER=vision -e POSTGRES_PASSWORD=change-me -e POSTGRES_DB=vision_goals postgres:16-alpine
npm install
npm run dev                          # http://localhost:3000 (migration รันให้อัตโนมัติ)
```

| คำสั่ง | ใช้ทำอะไร |
| --- | --- |
| `npm run lint` / `npm run typecheck` | ตรวจโค้ด |
| `npm run build` | build production |
| `npm run db:generate` | สร้างไฟล์ migration ใหม่หลังแก้ `src/server/db/schema.ts` |
| `npm run db:studio` | เปิด Drizzle Studio ดูข้อมูลในฐานข้อมูล |

## License

MIT © Zentyr
