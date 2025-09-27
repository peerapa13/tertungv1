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

// ==================== อัพโหลด + แสดงภาพ ====================
fileInput.addEventListener("change", e => {
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
            const base64 = event.target.result;

            // แสดงภาพบนหน้า
            addImageToDOM(base64);

            // เซฟลง IndexedDB
            const tx = db.transaction("images", "readwrite");
            const store = tx.objectStore("images");
            store.add({ data: base64 });
        };
        reader.readAsDataURL(file);
    });
});

// ==================== แสดงภาพบน DOM ====================
function addImageToDOM(base64, id=null) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("image-wrapper");

    const img = document.createElement("img");
    img.src = base64;
    wrapper.appendChild(img);

    const delBtn = document.createElement("button");
    delBtn.innerText = "x";
    delBtn.classList.add("delete-btn");
    delBtn.addEventListener("click", () => {
        wrapper.remove();
        if(id) deleteImageFromDB(id);
        updateUploadText();
    });
    wrapper.appendChild(delBtn);

    uploadArea.appendChild(wrapper);
    updateUploadText();
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
uploadArea.addEventListener("click", () => {
    fileInput.click();
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

// ==================== ลบภาพจาก IndexedDB ====================
function deleteImageFromDB(id) {
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    store.delete(id);
}

// ==================== popup เมื่อโหลดหน้า ====================
window.onload = function() {
    loadImagesFromDB()
    if (!localStorage.getItem('popupShown')) {
        showPopup();
        localStorage.setItem('popupShown', 'true');
    }
};
