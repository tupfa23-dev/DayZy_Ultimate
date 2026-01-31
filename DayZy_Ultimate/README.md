# DayZy Ultimate

ไฟล์ตัวอย่างโปรเจค DayZy Ultimate — เวอร์ชันชุดใหญ่ (feature-rich)
รวมฟีเจอร์:
- Login with Email (Firebase Authentication)
- Sync tasks to Firestore (per-day tasks)
- Full month calendar (FullCalendar)
- Team / Projects (basic create + pending-invite-by-email)
- Export / Import JSON for tasks
- Dark / Light theme
- Developer page (Thanawat Doopad)
- Local browser notifications (when app open) for upcoming reminders (demo)

## ติดตั้ง & รัน
1. แตกไฟล์ และเข้าโฟลเดอร์
2. ติดตั้ง dependency:
```
npm install
```
3. ตั้งค่า Firebase: แก้ `src/firebase.js` ด้วยค่าจาก Firebase Console
4. รัน dev server:
```
npm run dev
```

## หมายเหตุสำคัญ
- ระบบแชร์ (แชร์ด้วยอีเมล) ในตัวอย่างนี้เก็บเป็น pending invite (แค่บันทึกอีเมลไว้ใน Firestore) — production ควรมี backend ที่แมปอีเมลเป็น uid และส่ง invite
- การแจ้งเตือนแบบ background / push notifications ต้องตั้งค่า Firebase Cloud Messaging (FCM) และมี backend/worker เพื่อส่ง push; โปรเจคนี้มีตัวอย่าง local notification เมื่อแอปเปิดอยู่เท่านั้น
- FullCalendar ใช้ CSS จาก CDN (ใน `index.html`) — ถ้าต้องการติดตั้งแบบโมดูล ให้เพิ่ม dependency และ import CSS ในโค้ด
