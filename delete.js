// โหลดตัวแปรจากไฟล์ .env
require('dotenv').config();

// ใช้ข้อมูลจากตัวแปร environment
const cloudinary = require('cloudinary').v2;

cloudinary.v2.api
  .delete_resources([publicId], 
    { type: 'upload', resource_type: 'image' })
  .then(console.log);
