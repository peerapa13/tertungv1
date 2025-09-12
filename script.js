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

        const url = wrapper.dataset.url;
        uploadArea.removeChild(wrapper);

        let uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
        const index = uploadedImages.indexOf(url);
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
// สร้าง overlay loader
// ===================
function showLoader() {
    let loader = document.getElementById("loader-overlay");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "loader-overlay";
        loader.style.position = "fixed";
        loader.style.top = "0";
        loader.style.left = "0";
        loader.style.width = "100vw";
        loader.style.height = "100vh";
        loader.style.background = "rgba(0,0,0,0.5)";
        loader.style.zIndex = "9999"; 
        loader.style.display = "flex";
        loader.style.alignItems = "center";
        loader.style.justifyContent = "center";
        loader.style.flexDirection = "column";
        // สร้าง spinner
        const spinner = document.createElement("div");
        spinner.style.border = "8px solid #f3f3f3";
        spinner.style.borderTop = "8px solid #3498db";
        spinner.style.borderRadius = "50%";
        spinner.style.width = "60px";
        spinner.style.height = "60px";
        spinner.style.animation = "spin 1s linear infinite";
        loader.appendChild(spinner);
        // ข้อความ
        const text = document.createElement("div");
        text.innerText = "Processing...";
        text.style.color = "white";
        text.style.fontSize = "20px";
        text.style.marginTop = "12px";
        loader.appendChild(text);

        document.body.appendChild(loader);
        // ใส่ keyframes สำหรับ spinner
        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    loader.style.display = "flex";
}
function hideLoader() {
    const loader = document.getElementById("loader-overlay");
    if (loader) loader.style.display = "none";
}







async function handleFiles(files) {
    if (!files || files.length === 0) return;

    showLoader();
    const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];

    const apiKey = "0aee4c4792525d04ce7af1e6b7990cf6"; 

    const results = await Promise.all(Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append("image", file);
        fd.append("key", apiKey);

        try {
            const res = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: fd });
            const data = await res.json();

            if (!res.ok || !data.success) {
                console.error("Upload failed:", data);
                return null;
            }

            const url = data.data.url;

            const wrapper = document.createElement("div");
            wrapper.className = "image-wrapper";
            wrapper.dataset.url = url;

            const img = document.createElement("img");
            img.src = url;
            wrapper.appendChild(img);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.innerHTML = "×";
            wrapper.appendChild(deleteBtn);

            uploadArea.appendChild(wrapper);

            uploadedImages.push(url);
            return url;
        } catch (err) {
            console.error("Upload error:", err);
            return null;
        }
    }));

    const successfulUploads = results.filter(Boolean);
    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));

    hideLoader();
    return successfulUploads.map(url => ({ imageUrl: url }));
}



// ================= Load Images from LocalStorage =================
function loadImagesFromLocalStorage() {
    const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];
    uploadedImages.forEach(url => {
        const wrapper = document.createElement("div");
        wrapper.className = "image-wrapper";
        wrapper.dataset.url = url;

        const img = document.createElement("img");
        img.src = url;
        wrapper.appendChild(img);

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
    showLoader();
    uploadArea.innerHTML = '';

    const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];

    // map publicId เป็น Promise ของ checkImageProcessingStatus
    const promises = uploadedImages.map(async (publicId) => {
        const isReady = await checkImageProcessingStatus(publicId, "e_background_removal");

        if (isReady) {
            const wrapper = document.createElement("div");
            wrapper.classList.add("image-wrapper");

            const img = document.createElement("img");
            img.src = `https://res.cloudinary.com/dprcsygxc/image/upload/e_background_removal/${publicId}`;

            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-btn");
            deleteBtn.innerHTML = "×";

            wrapper.appendChild(img);
            wrapper.appendChild(deleteBtn);
            uploadArea.appendChild(wrapper);
        }
    });

    // รอทุกภาพเสร็จพร้อมกัน
    await Promise.all(promises);

    hideLoader(); // จะซ่อนหลังทุกภาพโหลดเสร็จ
}



async function en() {
    showLoader();
    uploadArea.innerHTML = '';

    const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages')) || [];

    const promises = uploadedImages.map(async (publicId) => {
        const isReady = await checkImageProcessingStatus(publicId, "e_enhance");

        if (isReady) {
            const wrapper = document.createElement("div");
            wrapper.classList.add("image-wrapper");

            const img = document.createElement("img");
            img.src = `https://res.cloudinary.com/dprcsygxc/image/upload/e_enhance/${publicId}`;

            const deleteBtn = document.createElement("button");
            deleteBtn.classList.add("delete-btn");
            deleteBtn.innerHTML = "×";

            wrapper.appendChild(img);
            wrapper.appendChild(deleteBtn);
            uploadArea.appendChild(wrapper);
        }
    });

    // รอทุกภาพเสร็จพร้อมกัน
    await Promise.all(promises);

    hideLoader(); // ซ่อน loader หลังทุกภาพโหลดเสร็จ
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
    showLoader();
    loadImagesFromLocalStorage();
    hideLoader();
    // ตรวจสอบว่า popup แสดงไปแล้วหรือยัง
    if (!localStorage.getItem('popupShown')) {
        // ถ้ายังไม่แสดง popup, แสดง popup
        document.getElementById('popupOverlay').style.display = 'block';
        // ตั้งค่าใน localStorage ว่ากล่อง popup แสดงแล้ว
        localStorage.setItem('popupShown', 'true');
    }
};













