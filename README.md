# ⭐ TERTUNG

![Logo](https://peerapa13.github.io/tertungv1/img/DALL%C2%B7E%202025-01-21%2020.19.36%20-%20A%20minimalist%20and%20elegant%20logo%20design%20for%20the%20name%20'TERTUNG',%20incorporating%20unique%20shapes%20.webp)

> “โปรเจค TertungV1 เป็นส่วนหนึ่งของโครงงานของชั้นมัธยมตอนปลาย เป็นส่วนหนึ่งโครงงานโครงงานเพื่อการศึกษา”  
ขณะนี้กำลังระหว่างการพัฒนา
TertungV1 เป็นเว็บแก้ไขภาพ AI ที่ช่วยแก้ไขภาพในคลิกเดียว

## 🔥 **จุดเด่นของ TertungV1**
- ✨ **AI ลบพื้นหลัง**
- 🌟 **AI ปรับปรุงคุณภาพให้ดีขึ้น**
- 🔗 **ฟรี!! ไม่มีโฆษณา ไม่มีลายน้ำ ดาวโหลดภาพที่แก้ไขได้ฟรี**

## 🔧 **เทคโนโลยีที่ใช้**
- **Frontend:** HTML, CSS, JavaScript
- **AI Processing:** `@imgly/background-removal` ผ่าน ESM CDN และ Canvas fallback
- **Storage:** IndexedDB ในเบราว์เซอร์ (ไม่ต้องมี backend หรือ API key)

## ✨ **วิธีการใช้งานโดยย่อ**
1. คลิกที่ [https://peerapa13.github.io/tertungv1/](https://peerapa13.github.io/tertungv1/)
2. อัปโหลดภาพ
3. แก้ไขภาพ (เพิ่ม Remove BG, Enhance)
4. ดาวโหลดไฟล์

## ✦ AI Prompt Editor

หลังอัปโหลดภาพ ให้คลิกภาพตัวอย่างเพื่อเปิดพื้นที่แก้ไข จากนั้นลากกรอบบริเวณที่ต้องการแก้และพิมพ์พร็อมต์ เช่น:

- `ทำให้ภาพสว่างและคมชัดขึ้น`
- `ทำบริเวณที่เลือกให้เป็นขาวดำ`
- `เบลอบริเวณที่เลือก`

ระบบประมวลผลคำสั่งในเบราว์เซอร์เพื่อไม่ส่งภาพออกจากอุปกรณ์ รองรับคำสั่งสว่าง/มืด, คมชัด, ขาวดำ, เบลอ, อุ่น, เย็น และวินเทจ

## Gemini image editing

ปุ่ม `ใช้ AI แก้ภาพ` ใช้ Gemini Image API จริง (`gemini-2.5-flash-image`) ผ่าน `api/edit-image.js` ซึ่งต้อง deploy โปรเจกต์นี้กับ Vercel และตั้ง Environment Variable ชื่อ `GEMINI_API_KEY` ใน Vercel เท่านั้น ห้ามใส่ key ในไฟล์ frontend หรือ commit ลง GitHub

หลัง deploy ให้ตั้งค่า `window.TERTUNG_API_URL` ใน `index.html` เป็น URL ของ Function เช่น `https://your-project.vercel.app/api/edit-image` แล้ว deploy หน้า GitHub Pages ใหม่

หากพบข้อความ quota exceeded ต้องเปิดใช้ billing หรือรอโควตาตามบัญชี Google AI Studio เพราะ free tier ของโมเดลสร้างภาพอาจมีโควตาเป็นศูนย์ในบางโปรเจกต์
