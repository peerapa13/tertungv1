function showPopup() {
    document.getElementById('popupOverlay').style.display = 'block';
};

// ฟังก์ชันปิด popup
function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
}

function clearUploadedImages() {
    localStorage.removeItem('uploadedImages');  // ลบข้อมูลที่เก็บไว้ใน uploadedImages
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
        
        // เก็บ public_id ใน localStorage
        const uploadedPublicId = data.public_id;
        let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
        uploadedImages.push(uploadedPublicId);
        localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));

        


        return { 
            imageUrl: data.secure_url,  // URL รูปภาพที่อัปโหลด
            publicId: uploadedPublicId  // ID สำหรับใช้ลบภาพ
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

    // แสดงภาพที่อัปโหลดในหน้า
    const imageWrapper = document.createElement("div");
    imageWrapper.classList.add("image-wrapper");

    const img = document.createElement("img");
    img.src = uploadedData.imageUrl; // ใช้ URL จาก localStorage

    imageWrapper.appendChild(img);
    uploadArea.appendChild(imageWrapper);
    

    // สร้างปุ่มลบ
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerHTML = "×";

    // เพิ่มฟังก์ชันลบภาพ
    deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        // ลบจาก uploadArea
        uploadArea.removeChild(imageWrapper);

        // ลบ public_id จาก localStorage
        let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
        const indexToRemove = uploadedImages.indexOf(uploadedData.publicId);
        if (indexToRemove !== -1) {
            uploadedImages.splice(indexToRemove, 1);  // ลบ public_id ออกจากอาร์เรย์
            localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));  // บันทึกการเปลี่ยนแปลงใน localStorage
            console.log(uploadedImages);
        }
    });

    imageWrapper.appendChild(deleteBtn);
    uploadArea.appendChild(imageWrapper);
}


function loadImagesFromLocalStorage() {
    let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
    
    uploadedImages.forEach(async (publicId) => {
        // ใช้ publicId เพื่อดึง URL ของภาพจาก Cloudinary
        const imageUrl = `https://res.cloudinary.com/dmdhq3u7b/image/upload/v${new Date().getTime()}/${publicId}.jpg`; // หรือปรับ URL ตามที่ใช้
        // สร้าง image element
        const imageWrapper = document.createElement("div");
        imageWrapper.classList.add("image-wrapper");

        const img = document.createElement("img");
        img.src = imageUrl;

        // สร้างปุ่มลบ
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerHTML = "×";

        // เพิ่มฟังก์ชันลบภาพ
        deleteBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            // ลบจาก uploadArea
            uploadArea.removeChild(imageWrapper);

            // ลบ public_id จาก localStorage
            let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
            const indexToRemove = uploadedImages.indexOf(publicId);
            if (indexToRemove !== -1) {
                uploadedImages.splice(indexToRemove, 1);  // ลบ public_id ออกจากอาร์เรย์
                localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));  // บันทึกการเปลี่ยนแปลงใน localStorage
                console.log(uploadedImages);
            }
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








async function re() {
    uploadArea.innerHTML = '';  // ล้างพื้นที่แสดงภาพเดิม
    let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
    
    // ฟังก์ชันเพื่อตรวจสอบว่า Cloudinary ประมวลผลภาพเสร็จหรือยัง
    async function checkImageProcessingStatus(publicId) {
        const imageUrl = `https://res.cloudinary.com/dmdhq3u7b/image/upload/e_background_removal/${publicId}`;

        let isImageReady = false;
        let retries = 10;  // กำหนดจำนวนการลองซ้ำหากภาพยังไม่เสร็จ

        while (retries > 0 && !isImageReady) {
            const response = await fetch(imageUrl, { method: 'HEAD' });  // ใช้ HTTP HEAD เพื่อเช็คสถานะภาพ
            if (response.ok) {
                isImageReady = true;  // ถ้าภาพโหลดได้ หมายความว่าประมวลผลเสร็จ
            } else {
                retries--;
                await new Promise(resolve => setTimeout(resolve, 250));  // รอ 0.25 วินาที ก่อนลองใหม่
            }
        }
        return isImageReady;
    }

    for (const publicId of uploadedImages) {
        // สร้าง URL ของ Cloudinary โดยใส่ publicId ลงใน URL
        const imageUrl = `https://res.cloudinary.com/dmdhq3u7b/image/upload/e_background_removal/${publicId}`;

        // เช็คสถานะภาพก่อนแสดง
        const isReady = await checkImageProcessingStatus(publicId);

        if (isReady) {
            // สร้าง element สำหรับแสดงภาพ
            const imageWrapper = document.createElement("div");
            imageWrapper.classList.add("image-wrapper");

            const img = document.createElement("img");
            img.src = imageUrl;  // ใช้ URL ที่สร้างจาก publicId

            // สร้างปุ่มลบ
            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-btn");
            deleteBtn.innerHTML = "×";

            // เพิ่มฟังก์ชันลบภาพ
            deleteBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                // ลบจาก uploadArea
                uploadArea.removeChild(imageWrapper);

                // ลบ public_id จาก localStorage
                let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
                const indexToRemove = uploadedImages.indexOf(publicId);
                if (indexToRemove !== -1) {
                    uploadedImages.splice(indexToRemove, 1);  // ลบ public_id ออกจากอาร์เรย์
                    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));  // บันทึกการเปลี่ยนแปลงใน localStorage
                }
            });

            imageWrapper.appendChild(img);
            imageWrapper.appendChild(deleteBtn);
            uploadArea.appendChild(imageWrapper);
        } else {
            console.log(`Image with publicId ${publicId} is not ready yet.`);
        }
    }
    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
    console.log(uploadedImages);
}







//e_viesus_correct
async function en() {
    uploadArea.innerHTML = '';  // ล้างพื้นที่แสดงภาพเดิม
    let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];

    // ฟังก์ชันเพื่อตรวจสอบว่า Cloudinary ประมวลผลภาพเสร็จหรือยัง
    async function checkImageProcessingStatus(publicId) {
        const imageUrl = `https://res.cloudinary.com/dmdhq3u7b/image/upload/e_enhance/${publicId}`;

        let isImageReady = false;
        let retries = 10;  // กำหนดจำนวนการลองซ้ำหากภาพยังไม่เสร็จ

        while (retries > 0 && !isImageReady) {
            const response = await fetch(imageUrl, { method: 'HEAD' });  // ใช้ HTTP HEAD เพื่อเช็คสถานะภาพ
            if (response.ok) {
                isImageReady = true;  // ถ้าภาพโหลดได้ หมายความว่าประมวลผลเสร็จ
            } else {
                retries--;
                await new Promise(resolve => setTimeout(resolve, 250));  // รอ 0.25 วินาที ก่อนลองใหม่
            }
        }
        return isImageReady;
    }

    for (const publicId of uploadedImages) {
        // ใช้ publicId แทน displayName
        const imageUrl = `https://res.cloudinary.com/dmdhq3u7b/image/upload/e_enhance/${publicId}`;

        // เช็คสถานะภาพก่อนแสดง
        const isReady = await checkImageProcessingStatus(publicId);

        if (isReady) {
            // สร้าง element สำหรับแสดงภาพ
            const imageWrapper = document.createElement("div");
            imageWrapper.classList.add("image-wrapper");

            const img = document.createElement("img");
            img.src = imageUrl;  // ใช้ URL ที่สร้างจาก publicId

            // สร้างปุ่มลบ
            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-btn");
            deleteBtn.innerHTML = "×";

            // เพิ่มฟังก์ชันลบภาพ
            deleteBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                // ลบจาก uploadArea
                uploadArea.removeChild(imageWrapper);

                // ลบ public_id จาก localStorage
                let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
                const indexToRemove = uploadedImages.indexOf(publicId);
                if (indexToRemove !== -1) {
                    uploadedImages.splice(indexToRemove, 1);  // ลบ public_id ออกจากอาร์เรย์
                    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));  // บันทึกการเปลี่ยนแปลงใน localStorage
                }
            });

            imageWrapper.appendChild(img);
            imageWrapper.appendChild(deleteBtn);
            uploadArea.appendChild(imageWrapper);
        } else {
            console.log(`Image with publicId ${publicId} is not ready yet.`);
        }
    }
    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
    console.log(uploadedImages);
}

async function downloadA(){
    const images = document.querySelectorAll("#upload-area img");

    if (images.length === 0) {
        alert("ไม่มีภาพให้ดาวน์โหลด");
        return;
    }

    for (let i = 0; i < images.length; i++) {
        const img = images[i];

        // ดึงภาพจาก `<img>` และแปลงเป็น Blob
        const response = await fetch(img.src);
        const blob = await response.blob();

        // สร้าง URL object
        const blobUrl = URL.createObjectURL(blob);

        // สร้างลิงก์ดาวน์โหลด
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `image_${i + 1}.png`; // ตั้งชื่อไฟล์
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // ล้าง URL ที่สร้างขึ้น
        URL.revokeObjectURL(blobUrl);

        await new Promise(resolve => setTimeout(resolve, 500)); // หน่วงเวลาป้องกันโหลดพร้อมกันเกินไป
    }
    
}

// ฟังก์ชันลบภาพทั้งหมด แต่ลบเฉพาะ public_id
function deleteA() {
    // ล้างพื้นที่ uploadArea
    uploadArea.innerHTML = "";

    // เคลียร์เฉพาะ array ของ public_id
    localStorage.setItem('uploadedImages', JSON.stringify([]));

    // รีเซ็ตค่า file input 
    fileInput.value = "";

}







/* ส่วนของการกดปุ่มเรียกฟังชั่น */
//ลบพื้นหลัง
document.getElementById('removebg').addEventListener('click', () => {
    re()
});

//แก้ไข้ภาพ
document.getElementById('Enhancingimages').addEventListener('click', () => {
    en()
});

//โหลดภาพ
document.getElementById("downloadAll").addEventListener("click", () => {
    downloadA()
});

//ลบภาพทั้งหมด
document.getElementById("removeAll").addEventListener("click", () => {
    deleteA()
});



// ฟังก์ชันสำหรับแสดง popup ตอนโหลดหน้า
window.onload = function() {
    loadImagesFromLocalStorage(); 
    // ตรวจสอบว่า popup แสดงไปแล้วหรือยัง
    if (!localStorage.getItem('popupShown')) {
        // ถ้ายังไม่แสดง popup, แสดง popup
        document.getElementById('popupOverlay').style.display = 'block';

        // ตั้งค่าใน localStorage ว่ากล่อง popup แสดงแล้ว
        localStorage.setItem('popupShown', 'true');
    }
};





