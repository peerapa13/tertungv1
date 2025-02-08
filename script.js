// ฟังก์ชันสำหรับแสดง popup ตอนโหลดหน้า
window.onload = function() {
    // ตรวจสอบว่า popup แสดงไปแล้วหรือยัง
    if (!localStorage.getItem('popupShown')) {
        // ถ้ายังไม่แสดง popup, แสดง popup
        document.getElementById('popupOverlay').style.display = 'block';

        // ตั้งค่าใน localStorage ว่ากล่อง popup แสดงแล้ว
        localStorage.setItem('popupShown', 'true');
    }
};

// ฟังก์ชันแสดง popup
function showPopup() {
    document.getElementById('popupOverlay').style.display = 'block';
};

// ฟังก์ชันปิด popup
function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
}

// ฟังก์ชันอัปโหลดภาพไปยัง Cloudinary
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "imgweb"); // ใช้ Upload Preset

    try {
        const response = await fetch("https://api.cloudinary.com/v1_1/dmdhq3u7b/image/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        console.log(data);
        return { 
            imageUrl: data.secure_url,  // URL รูปภาพที่อัปโหลด
            publicId: data.public_id    // ID สำหรับใช้ลบภาพ (จะไม่ใช้ในกรณีนี้)
        };
    } catch (error) {
        console.error("Upload failed:", error);
        alert("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่");
        return null;
    }
}

// ฟังก์ชันแสดงภาพที่อัปโหลด
async function displayImage(file) {
    const uploadedData = await uploadToCloudinary(file);
    if (!uploadedData) return;

    // เก็บ URL ของภาพใน localStorage
    const uploadedImages = JSON.parse(localStorage.getItem("uploadedImages")) || [];
    uploadedImages.push(uploadedData.imageUrl);
    localStorage.setItem("uploadedImages", JSON.stringify(uploadedImages));

    // แสดงภาพที่อัปโหลดในหน้า
    const imageWrapper = document.createElement("div");
    imageWrapper.classList.add("image-wrapper");

    const img = document.createElement("img");
    img.src = uploadedData.imageUrl; // ใช้ URL จาก Cloudinary

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerHTML = "×";

    // เพิ่มฟังก์ชันลบภาพจาก localStorage
    deleteBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        uploadArea.removeChild(imageWrapper);

        // ลบ URL จาก localStorage
        const uploadedImages = JSON.parse(localStorage.getItem("uploadedImages")) || [];
        const updatedImages = uploadedImages.filter(url => url !== uploadedData.imageUrl);
        localStorage.setItem("uploadedImages", JSON.stringify(updatedImages));
    });

    imageWrapper.appendChild(img);
    imageWrapper.appendChild(deleteBtn);
    uploadArea.appendChild(imageWrapper);
}

// ฟังก์ชันดึงข้อมูล URL จาก localStorage และแสดงผล
function displaySavedImages() {
    const uploadedImages = JSON.parse(localStorage.getItem("uploadedImages")) || [];
    uploadedImages.forEach(imageUrl => {
        const imageWrapper = document.createElement("div");
        imageWrapper.classList.add("image-wrapper");

        const img = document.createElement("img");
        img.src = imageUrl;

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerHTML = "×";

        // เพิ่มฟังก์ชันลบภาพจาก localStorage
        deleteBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            uploadArea.removeChild(imageWrapper);

            // ลบ URL ออกจาก localStorage
            const uploadedImages = JSON.parse(localStorage.getItem("uploadedImages")) || [];
            const updatedImages = uploadedImages.filter(url => url !== imageUrl);
            localStorage.setItem("uploadedImages", JSON.stringify(updatedImages));
        });

        imageWrapper.appendChild(img);
        imageWrapper.appendChild(deleteBtn);
        uploadArea.appendChild(imageWrapper);
    });
}

// การจัดการเมื่อคลิกพื้นที่อัปโหลด
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");

uploadArea.addEventListener("click", (event) => {
    if (event.target === uploadArea) {
        fileInput.click(); // เปิด input file เมื่อคลิกที่ uploadArea
    }
});

// การจัดการเมื่อเลือกไฟล์ผ่าน input
fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    Array.from(files).forEach((file) => {
        displayImage(file);
    });
});

// เรียกใช้ฟังก์ชันดึงข้อมูลเมื่อโหลดหน้า
window.addEventListener("load", displaySavedImages);

// ปุ่มแก้ไข
document.getElementById('edit-button').addEventListener('click', () => {
    // เปลี่ยนไปยังหน้า main.html
    window.location.href = './main.html';
});


