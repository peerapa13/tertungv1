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



//เช็คว่าควรแสดงข้อความไหม
function updateUploadText() {
    const uploadText = document.getElementById("upload-text");
    const hasImages = uploadArea.querySelectorAll(".image-wrapper").length > 0;

    if (hasImages) {
        uploadText.style.display = "none"; 
    } else {
        uploadText.style.display = "block"; 
    }
}

// การจัดการเมื่อคลิกพื้นที่อัปโหลด
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");


// สร้าง observer เพื่อเช็คว่า uploadArea ไม่มีไฟล์แล้วหรือไม่
const observer = new MutationObserver(() => {
    updateUploadText();
});
observer.observe(uploadArea, { childList: true });
updateUploadText();


// อัปโหลดหลายไฟล์ไปยัง Cloudinaryพร้อมกัน + preview 
async function handleFiles(files) {
    const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];

    // สร้าง preview ทุกไฟล์ก่อน
    const previews = Array.from(files).map(file => {
        const wrapper = document.createElement("div");
        wrapper.className = "image-wrapper";
        wrapper.style.position = "relative"; // ให้ overlay ซ้อนได้

        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.style.opacity = "0.5"; // ทำให้ซีดลงบอกว่ายังอัปโหลดไม่เสร็จ
        wrapper.appendChild(img);

        // overlay "Uploading..."
        const overlay = document.createElement("div");
        overlay.innerText = "Uploading...";
        overlay.style.position = "absolute";
        overlay.style.top = "50%";
        overlay.style.left = "50%";
        overlay.style.transform = "translate(-50%, -50%)";
        overlay.style.color = "white";
        overlay.style.background = "rgba(0,0,0,0.6)";
        overlay.style.padding = "4px 8px";
        overlay.style.borderRadius = "6px";
        overlay.style.fontSize = "14px";
        wrapper.appendChild(overlay);

        // ปุ่มลบ
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = "×";
        deleteBtn.addEventListener("click", e => {
            e.stopPropagation();
            wrapper.remove();
            const index = uploadedImages.indexOf(wrapper.dataset.publicId);
            if (index !== -1) {
                uploadedImages.splice(index, 1);
                localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
            }
        });
        wrapper.appendChild(deleteBtn);

        uploadArea.appendChild(wrapper);

        return { file, wrapper, img, overlay };
    });

    // อัปโหลดทุกไฟล์พร้อมกัน
    const uploadPromises = previews.map(({ file, wrapper, img, overlay }) =>
        fetch("https://api.cloudinary.com/v1_1/dprcsygxc/image/upload", {
            method: "POST",
            body: (() => {
                const fd = new FormData();
                fd.append("file", file);
                fd.append("upload_preset", "imgweb");
                return fd;
            })()
        })
        .then(res => res.json())
        .then(data => {
            img.src = data.secure_url;
            img.style.opacity = "1";         // กลับมาเต็มสี
            wrapper.removeChild(overlay);    // เอา overlay ออก
            wrapper.dataset.publicId = data.public_id;
            uploadedImages.push(data.public_id);
            return data;
        })
        .catch(() => wrapper.remove())
    );

    // รอให้ทุกไฟล์อัปโหลดเสร็จ แล้วเก็บ localStorage ทีเดียว
    const results = await Promise.all(uploadPromises);
    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));

    return results.map(r => ({ imageUrl: r.secure_url, publicId: r.public_id }));
}


// ฟังก์ชันแสดงภาพที่อัปโหลด
async function displayImage(file) {
     if (!uploadedData) return;

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "image-wrapper";

    imageWrapper.innerHTML = `
        <img src="${uploadedData.imageUrl}" />
        <button class="delete-btn">×</button>
    `;

    const deleteBtn = imageWrapper.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        uploadArea.removeChild(imageWrapper);

        const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
        const index = uploadedImages.indexOf(uploadedData.publicId);
        if (index !== -1) {
            uploadedImages.splice(index, 1);
            localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
        }
    });

    uploadArea.appendChild(imageWrapper);
}

//แสดงตอนเข้าเว็บอีกครั้ง
function loadImagesFromLocalStorage() {
    let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
    
    uploadedImages.forEach(async (publicId) => {
        // ใช้ publicId เพื่อดึง URL ของภาพจาก Cloudinary
        const imageUrl = `https://res.cloudinary.com/dprcsygxc/image/upload/v${new Date().getTime()}/${publicId}.jpg`; // หรือปรับ URL ตามที่ใช้
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





// คลิกพื้นที่อัปโหลด
uploadArea.addEventListener("click", (e) => {
    if (e.target === uploadArea) fileInput.click();
});

// เลือกไฟล์
fileInput.addEventListener("change", (e) => handleFiles(e.target.files));






async function re() {
    uploadArea.innerHTML = '';  // ล้างพื้นที่แสดงภาพเดิม
    let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
    
    // ฟังก์ชันเพื่อตรวจสอบว่า Cloudinary ประมวลผลภาพเสร็จหรือยัง
    async function checkImageProcessingStatus(publicId) {
        const imageUrl = `https://res.cloudinary.com/dprcsygxc/image/upload/e_background_removal/${publicId}`;

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
        const imageUrl = `https://res.cloudinary.com/dprcsygxc/image/upload/e_background_removal/${publicId}`;

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
        const imageUrl = `https://res.cloudinary.com/dprcsygxc/image/upload/e_enhance/${publicId}`;

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
        const imageUrl = `https://res.cloudinary.com/dprcsygxc/image/upload/e_enhance/${publicId}`;

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
    
    const images = uploadArea.querySelectorAll(".image-wrapper");
    images.forEach(img => uploadArea.removeChild(img));

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




