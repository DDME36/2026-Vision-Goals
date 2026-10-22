# ย้ายข้อมูลจาก Supabase เดิม

1. เปิด Supabase → SQL Editor แล้วรัน (เปลี่ยน `<user-id>` เป็น id ของคุณจากตาราง `auth.users`):

   ```sql
   select json_build_object('goals', json_agg(g order by g.year, g.position))
   from goals g
   where g.user_id = '<user-id>';
   ```

2. คัดลอกผลลัพธ์ (JSON) บันทึกเป็นไฟล์ `goals.json`
3. ล็อกอินเข้า Vision Goals ตัวใหม่ → เมนูบัญชี (มุมขวาบน) → **นำเข้าข้อมูล** → เลือก `goals.json`

ระบบจะข้ามเป้าหมายที่ชื่อซ้ำกันในปีเดียวกันให้อัตโนมัติ จึงนำเข้าซ้ำได้อย่างปลอดภัย
หมวดหมู่ที่ไม่รู้จักจะถูกจัดเป็น "ทั่วไป"
