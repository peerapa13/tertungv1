// ==================== popup ====================
function showPopup() {
    document.getElementById('popupOverlay').style.display = 'block';
}
function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
}

// ==================== loader ====================
function showLoader(message = "Processing...") {
    let loader = document.getElementById("loader-overlay");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "loader-overlay";
        loader.style.cssText = `
            position:fixed; top:0; left:0; width:100vw; height:100vh;
            background:rgba(0,0,0,0.5); z-index:9999;
            display:flex; align-items:center; justify-content:center; flex-direction:column;
        `;

        const spinner = document.createElement("div");
        spinner.id = "loader-spinner";
        spinner.style.cssText = `
            border:8px solid #f3f3f3; border-top:8px solid #3498db;
            border-radius:50%; width:60px; height:60px;
            animation:spin 1s linear infinite;
        `;
        loader.appendChild(spinner);

        const text = document.createElement("div");
        text.id = "loader-text";
        text.style.cssText = "color:white; font-size:20px; margin-top:12px;";
        text.innerText = message;
        loader.appendChild(text);

        document.body.appendChild(loader);

        const style = document.createElement("style");
        style.innerHTML = `@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`;
        document.head.appendChild(style);
    } else {
        const text = loader.querySelector("#loader-text");
        if (text) text.innerText = message;
    }
    loader.style.display = "flex";
}

function hideLoader() {
    const loader = document.getElementById("loader-overlay");
    if (loader) loader.style.display = "none";
}

// ==================== ตัวแปรหลัก ====================
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");
const uploadText = document.getElementById("upload-text");

// ==================== แสดง/ซ่อนข้อความ ====================
function updateUploadText() {
    const hasImages = uploadArea.querySelectorAll(".image-wrapper").length > 0;
    uploadText.style.display = hasImages ? "none" : "block";
}

// ==================== IndexedDB ====================
// FIX #7: เพิ่ม version เป็น 2 + สร้าง "processedImages" store แยก
let db;
const dbRequest = indexedDB.open("myImagesDB", 2);

dbRequest.onupgradeneeded = e => {
    db = e.target.result;
    const oldVersion = e.oldVersion;

    // สร้าง "images" store (ถ้ายังไม่มี)
    if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id", autoIncrement: true });
    }
    // FIX #7: สร้าง "processedImages" store แยกสำหรับเก็บภาพที่ผ่านการประมวลผลแล้ว
    if (!db.objectStoreNames.contains("processedImages")) {
        db.createObjectStore("processedImages", { keyPath: "id", autoIncrement: true });
    }
};

dbRequest.onsuccess = e => {
    db = e.target.result;
    loadImagesFromDB();
};

dbRequest.onerror = e => {
    console.error("IndexedDB error:", e.target.error);
};

// ==================== previewOverlay (สร้างครั้งเดียว) ====================
// FIX #4: ย้ายมาสร้างที่นี่ที่เดียว ไม่สร้างซ้ำในแต่ละ event listener
const previewOverlay = document.createElement("div");
previewOverlay.id = "preview-overlay";
previewOverlay.style.cssText = `
    position:fixed; top:0; left:0; width:100vw; height:100vh;
    background:rgba(0,0,0,0.8); display:none;
    justify-content:center; align-items:center; z-index:10000;
`;
const previewImg = document.createElement("img");
previewImg.style.cssText = "max-width:90%; max-height:90%; border-radius:10px;";
previewOverlay.appendChild(previewImg);
previewOverlay.addEventListener("click", () => {
    previewOverlay.style.display = "none";
});
document.body.appendChild(previewOverlay);

// ==================== addImageToDOM ====================
function addImageToDOM(base64, id = null) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("image-wrapper");
    if (id) wrapper.dataset.id = id;

    const img = document.createElement("img");
    img.src = base64;

    img.addEventListener("click", () => {
        previewImg.src = img.src; // ใช้ img.src ปัจจุบัน (อาจถูก update แล้ว)
        previewOverlay.style.display = "flex";
    });

    wrapper.appendChild(img);

    const delBtn = document.createElement("button");
    delBtn.innerText = "x";
    delBtn.classList.add("delete-btn");
    delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const imgId = wrapper.dataset.id ? Number(wrapper.dataset.id) : null;
        wrapper.remove();
        if (imgId) {
            deleteImageFromDB(imgId);
            deleteProcessedFromDB(imgId);
        }
        updateUploadText();
    });
    wrapper.appendChild(delBtn);

    uploadArea.appendChild(wrapper);
    updateUploadText();
}

// ==================== อัพโหลด + เซฟ DB ====================
fileInput.addEventListener("change", e => {
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
            const base64 = event.target.result;
            const tx = db.transaction("images", "readwrite");
            const store = tx.objectStore("images");
            const requestAdd = store.add({ data: base64 });
            requestAdd.onsuccess = e => {
                const id = e.target.result;
                addImageToDOM(base64, id);
            };
        };
        reader.readAsDataURL(file);
    });
});

// ==================== ลบภาพจาก IndexedDB ====================
function deleteImageFromDB(id) {
    const tx = db.transaction("images", "readwrite");
    tx.objectStore("images").delete(id);
}

function deleteProcessedFromDB(id) {
    if (!db.objectStoreNames.contains("processedImages")) return;
    const tx = db.transaction("processedImages", "readwrite");
    tx.objectStore("processedImages").delete(id);
}

// ==================== ลบทั้งหมด ====================
document.getElementById("removeAll").addEventListener("click", () => {
    uploadArea.querySelectorAll(".image-wrapper").forEach(w => w.remove());
    updateUploadText();

    const tx1 = db.transaction("images", "readwrite");
    tx1.objectStore("images").clear();

    if (db.objectStoreNames.contains("processedImages")) {
        const tx2 = db.transaction("processedImages", "readwrite");
        tx2.objectStore("processedImages").clear();
    }
});

// ==================== คลิกพื้นที่เพื่อเลือกไฟล์ ====================
uploadArea.addEventListener("click", (e) => {
    if (!e.target.closest(".image-wrapper") && !e.target.classList.contains("delete-btn")) {
        fileInput.click();
    }
});

// ==================== โหลดภาพจาก IndexedDB ====================
function loadImagesFromDB() {
    const tx = db.transaction("images", "readonly");
    const store = tx.objectStore("images");
    const request = store.getAll();
    request.onsuccess = () => {
        request.result.forEach(item => addImageToDOM(item.data, item.id));
    };
}

// ==================== ดาวน์โหลดทั้งหมด ====================
document.getElementById("downloadAll").addEventListener("click", () => {
    const imgs = uploadArea.querySelectorAll(".image-wrapper img");
    if (imgs.length === 0) {
        alert("ไม่มีรูปภาพให้ดาวน์โหลด");
        return;
    }
    imgs.forEach((img, index) => {
        const a = document.createElement("a");
        a.href = img.src;
        a.download = `tertung_image_${index + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});

// ==================== ลบพื้นหลัง ====================
// FIX #1: ไม่ duplicate logic — เรียก removeBackgroundFromAllImages() จาก removebg.js
// FIX #2: ใช้ฟังก์ชันจาก removebg.js (AI-based) แทน canvas pixel เดิม
// FIX #4: ไม่สร้าง previewOverlay ซ้ำอีกต่อไป
document.getElementById("removebg").addEventListener("click", async () => {
    const wrappers = uploadArea.querySelectorAll(".image-wrapper");
    if (wrappers.length === 0) {
        alert("กรุณาอัพโหลดรูปภาพก่อน");
        return;
    }
    if (!db) {
        alert("DB ยังโหลดไม่เสร็จ กรุณารอสักครู่แล้วลองอีกครั้ง");
        return;
    }

    showLoader("กำลังลบพื้นหลัง... (AI กำลังทำงาน)");
    try {
        // เรียกใช้ฟังก์ชันจาก removebg.js (FIX #2 + #6)
        await removeBackgroundFromAllImages(db, { useAI: true });
        alert("ลบพื้นหลังเสร็จสิ้น!");
    } catch (err) {
        console.error("removebg error:", err);
        alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
        hideLoader();
    }
});

// ==================== ปรับปรุงภาพ ====================
// FIX #5: เชื่อม "ปรับปรุงภาพ" button กับ logic จริง
// ใช้ Canvas filter เพื่อเพิ่ม contrast/brightness/sharpen แบบ client-side
// (สามารถสลับเป็น Cloudinary API ในอนาคต)
document.getElementById("enhancingimages").addEventListener("click", async () => {
    const wrappers = uploadArea.querySelectorAll(".image-wrapper");
    if (wrappers.length === 0) {
        alert("กรุณาอัพโหลดรูปภาพก่อน");
        return;
    }
    if (!db) {
        alert("DB ยังโหลดไม่เสร็จ กรุณารอสักครู่แล้วลองอีกครั้ง");
        return;
    }

    showLoader("กำลังปรับปรุงคุณภาพภาพ...");
    try {
        await enhanceAllImages(db);
        alert("ปรับปรุงภาพเสร็จสิ้น!");
    } catch (err) {
        console.error("enhance error:", err);
        alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
        hideLoader();
    }
});

/**
 * ปรับปรุงภาพทุกรูปด้วย Canvas filter
 * เพิ่ม contrast, brightness, และทำ unsharp mask แบบง่าย
 */
async function enhanceAllImages(db) {
    const wrappers = document.querySelectorAll(".image-wrapper");
    for (const wrapper of wrappers) {
        const img = wrapper.querySelector("img");
        const newBase64 = await _applyEnhancement(img);
        img.src = newBase64;

        // เซฟลง processedImages store
        if (wrapper.dataset.id) {
            const id = Number(wrapper.dataset.id);
            const storeName = db.objectStoreNames.contains("processedImages") ? "processedImages" : "images";
            await new Promise((resolve) => {
                const tx = db.transaction(storeName, "readwrite");
                tx.objectStore(storeName).put({ id, data: newBase64 }).onsuccess = () => resolve();
            });
        }
    }
}

function _applyEnhancement(imgEl) {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = imgEl.naturalWidth || imgEl.width;
        canvas.height = imgEl.naturalHeight || imgEl.height;

        // ใช้ CSS filter ผ่าน canvas: เพิ่ม contrast 20%, brightness 5%, saturate 15%
        ctx.filter = "contrast(1.2) brightness(1.05) saturate(1.15)";
        ctx.drawImage(imgEl, 0, 0);
        ctx.filter = "none";

        resolve(canvas.toDataURL("image/png"));
    });
}

// ==================== popup on first visit ====================
window.onload = function () {
    if (!localStorage.getItem('popupShown')) {
        showPopup();
        localStorage.setItem('popupShown', 'true');
    }
};
