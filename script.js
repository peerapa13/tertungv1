function showPopup() {
    document.getElementById('popupOverlay').style.display = 'block';
};

// ฟังก์ชันปิด popup
function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
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

//======================================================================================
//ภายในกรอบแก้ไข้
//======================================================================================
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

// คลิกพื้นที่อัปโหลด
uploadArea.addEventListener("click", (e) => {
    if (e.target === uploadArea) fileInput.click();
});
// เลือกไฟล์
fileInput.addEventListener("change", (e) => handleFiles(e.target.files));








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















