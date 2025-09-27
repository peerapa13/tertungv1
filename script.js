// ==================== popup ====================
function showPopup() {
    document.getElementById('popupOverlay').style.display = 'block';
}
function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
}

// ==================== loader ====================
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

        const spinner = document.createElement("div");
        spinner.style.border = "8px solid #f3f3f3";
        spinner.style.borderTop = "8px solid #3498db";
        spinner.style.borderRadius = "50%";
        spinner.style.width = "60px";
        spinner.style.height = "60px";
        spinner.style.animation = "spin 1s linear infinite";
        loader.appendChild(spinner);

        const text = document.createElement("div");
        text.innerText = "Processing...";
        text.style.color = "white";
        text.style.fontSize = "20px";
        text.style.marginTop = "12px";
        loader.appendChild(text);

        document.body.appendChild(loader);

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
let db;
const request = indexedDB.open("myImagesDB", 1);

request.onupgradeneeded = e => {
    db = e.target.result;
    db.createObjectStore("images", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = e => {
    db = e.target.result;
    loadImagesFromDB();
};

request.onerror = e => {
    console.error("IndexedDB error:", e.target.error);
};

// ==================== พรีวิวรูปใหญ่ ====================
const previewOverlay = document.createElement("div");
previewOverlay.id = "preview-overlay";
previewOverlay.style.cssText = `
    position: fixed; top:0; left:0; width:100vw; height:100vh;
    background: rgba(0,0,0,0.8); display:none;
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
function addImageToDOM(base64, id=null) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("image-wrapper");
    if(id) wrapper.dataset.id = id;

    const img = document.createElement("img");
    img.src = base64;

    // คลิกรูปเพื่อ preview
    img.addEventListener("click", () => {
        previewImg.src = base64;
        previewOverlay.style.display = "flex";
    });

    wrapper.appendChild(img);

    const delBtn = document.createElement("button");
    delBtn.innerText = "x";
    delBtn.classList.add("delete-btn");
    delBtn.addEventListener("click", (e) => { 
        e.stopPropagation(); // ไม่ให้ trigger preview
        wrapper.remove();
        if(id) deleteImageFromDB(id);
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
    const store = tx.objectStore("images");
    store.delete(id);
}

// ==================== ลบทั้งหมด ====================
document.getElementById("removeAll").addEventListener("click", () => {
    const wrappers = uploadArea.querySelectorAll(".image-wrapper");
    wrappers.forEach(w => w.remove());
    updateUploadText();

    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    store.clear();
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
        request.result.forEach(item => {
            addImageToDOM(item.data, item.id);
        });
    };
}

// ==================== ดาวน์โหลดทั้งหมด ====================
document.getElementById("downloadAll").addEventListener("click", () => {
    const wrappers = uploadArea.querySelectorAll(".image-wrapper img");
    if (wrappers.length === 0) {
        alert("ไม่มีรูปภาพให้ดาวน์โหลด");
        return;
    }

    wrappers.forEach((img, index) => {
        const a = document.createElement("a");
        a.href = img.src;
        a.download = `image_${index + 1}.png`; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});

// ==================== เรียกใช้ฟังก์ชั่น ====================
document.getElementById("removebg").addEventListener("click", ()=>{
    const script = document.createElement("script");
    script.src = "https://raw.githubusercontent.com/username/repo/main/removebg.js";
    script.onload = async ()=>{
        if(!db){
            alert("DB ยังไม่พร้อม!");
            return;
        }
        showLoader();
        await removeBackgroundFromAllImages(db);
        hideLoader();
    };
    document.body.appendChild(script);
});


// ==================== popup ====================
window.onload = function() {
    if (!localStorage.getItem('popupShown')) {
        showPopup();
        localStorage.setItem('popupShown', 'true');
    }
};
