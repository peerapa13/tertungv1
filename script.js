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



// ===================
// Event Delegation สำหรับปุ่มลบ
// ===================
uploadArea.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
        const wrapper = e.target.closest(".image-wrapper");
        if (!wrapper) return;

        const publicId = wrapper.dataset.publicId;
        uploadArea.removeChild(wrapper);

        // ลบ publicId จาก localStorage
        let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
        const index = uploadedImages.indexOf(publicId);
        if (index !== -1) {
            uploadedImages.splice(index, 1);
            localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
        }
    }
});

// ===================
// ฟังก์ชันตรวจสอบสถานะภาพจาก Cloudinary
// ===================
async function checkImageProcessingStatus(publicId, type = "e_background_removal", retries = 10, delay = 250) {
    const imageUrl = `https://res.cloudinary.com/dprcsygxc/image/upload/${type}/${publicId}`;

    while (retries > 0) {
        try {
            const response = await fetch(imageUrl, { method: 'HEAD' });
            if (response.ok) return true; // ภาพพร้อมใช้งาน
        } catch (err) {
            console.error(err);
        }
        retries--;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false; 
}

// ===================
// ฟังก์ชันสร้าง preview ของไฟล์
// ===================
function createImagePreview(file) {
    const wrapper = document.createElement("div");
    wrapper.className = "image-wrapper";
    wrapper.style.position = "relative";

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.opacity = "0.5"; // บอกว่ายังอัปโหลดไม่เสร็จ
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
    

    uploadArea.appendChild(wrapper);

    return { file, wrapper, img, overlay };
}


// ฟังก์ชันอัปโหลดไฟล์ทั้งหมด
async function handleFiles(files) {
    const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];

    // สร้าง preview
    const previews = Array.from(files).map(file => createImagePreview(file));

    // อัปโหลดทุกไฟล์พร้อมกัน
    const results = await Promise.all(previews.map(async ({ file, wrapper, img, overlay }) => {
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("upload_preset", "imgweb");

            const res = await fetch("https://api.cloudinary.com/v1_1/dprcsygxc/image/upload", { method: "POST", body: fd });
            const data = await res.json();

            // อัปเดต preview
            img.src = data.secure_url;
            img.style.opacity = "1";            
            wrapper.removeChild(overlay);
            wrapper.dataset.publicId = data.public_id;

             // ปุ่มลบ 
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.innerHTML = "×";
            wrapper.appendChild(deleteBtn);

            uploadedImages.push(data.public_id);
            return data;
        } catch (err) {
            wrapper.remove(); // ลบ preview ถ้า upload fail
            return null;
        }
    }));

    // เก็บ publicId ทั้งหมด
    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));

    return results.filter(r => r !== null).map(r => ({ imageUrl: r.secure_url, publicId: r.public_id }));
}




// โหลดภาพจาก localStorage
function loadImagesFromLocalStorage() {
    const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];

    uploadedImages.forEach(publicId => {
        // สร้าง wrapper โดยใช้ createImagePreview แต่ไม่ต้อง overlay
        const wrapper = document.createElement("div");
        wrapper.className = "image-wrapper";
        wrapper.dataset.publicId = publicId;

        const img = document.createElement("img");
        img.src = `https://res.cloudinary.com/dprcsygxc/image/upload/${publicId}.jpg`; 
        wrapper.appendChild(img);

        // ปุ่มลบ 
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-btn";
        deleteBtn.innerHTML = "×";
        wrapper.appendChild(deleteBtn);

        uploadArea.appendChild(wrapper);
    });
}






// คลิกพื้นที่อัปโหลด
uploadArea.addEventListener("click", (e) => {
    if (e.target === uploadArea) fileInput.click();
});

// เลือกไฟล์
fileInput.addEventListener("change", (e) => handleFiles(e.target.files));




async function re() {
    uploadArea.innerHTML = '';  
    const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
    
    // สร้าง preview
    const previews = Array.from(files).map(file => createImagePreview(file));

    for (const publicId of uploadedImages) {
        const isReady = await checkImageProcessingStatus(publicId, "e_background_removal");

        if (isReady) {
            const imageWrapper = document.createElement("div");
            imageWrapper.classList.add("image-wrapper");

            const img = document.createElement("img");
            img.src = `https://res.cloudinary.com/dprcsygxc/image/upload/e_background_removal/${publicId}`;

            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-btn");
            deleteBtn.innerHTML = "×";

            imageWrapper.appendChild(img);
            imageWrapper.appendChild(deleteBtn);
            uploadArea.appendChild(imageWrapper);
        } else {
            console.log(`Image with publicId ${publicId} is not ready yet.`);
        }
    }
}




async function en() {
    uploadArea.innerHTML = '';  
    const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];

    for (const publicId of uploadedImages) {
        const isReady = await checkImageProcessingStatus(publicId, "e_enhance");

        if (isReady) {
            const imageWrapper = document.createElement("div");
            imageWrapper.classList.add("image-wrapper");

            const img = document.createElement("img");
            img.src = `https://res.cloudinary.com/dprcsygxc/image/upload/e_enhance/${publicId}`;

            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-btn");
            deleteBtn.innerHTML = "×";


            imageWrapper.appendChild(img);
            imageWrapper.appendChild(deleteBtn);
            uploadArea.appendChild(imageWrapper);
        } else {
            console.log(`Image with publicId ${publicId} is not ready yet.`);
        }
    }
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




