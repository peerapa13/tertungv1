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

// ==================== อัพโหลด + แสดงภาพ ====================
fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const wrapper = document.createElement("div");
            wrapper.className = "image-wrapper";
            wrapper.style.display = "inline-block";
            wrapper.style.position = "relative";
            wrapper.style.margin = "5px";

            const img = document.createElement("img");
            img.src = event.target.result;
            img.style.maxWidth = "200px";
            img.style.border = "1px solid #ccc";
            wrapper.appendChild(img);

            const delBtn = document.createElement("button");
            delBtn.innerText = "×";
            delBtn.style.position = "absolute";
            delBtn.style.top = "2px";
            delBtn.style.right = "2px";
            delBtn.style.background = "red";
            delBtn.style.color = "white";
            delBtn.style.border = "none";
            delBtn.style.cursor = "pointer";

            delBtn.addEventListener("click", () => {
                wrapper.remove();
                updateUploadText();
            });

            wrapper.appendChild(delBtn);
            uploadArea.appendChild(wrapper);

            updateUploadText();
        }
        reader.readAsDataURL(file);
    });
});

// ==================== ลบทั้งหมด ====================
document.getElementById("removeAll").addEventListener("click", () => {
    const wrappers = uploadArea.querySelectorAll(".image-wrapper");
    wrappers.forEach(w => w.remove());
    updateUploadText();
});

// ==================== คลิกพื้นที่เพื่อเลือกไฟล์ ====================
uploadArea.addEventListener("click", () => {
    fileInput.click();
});


// ฟังก์ชันสำหรับแสดง popup ตอนโหลดหน้า
window.onload = function() {
    if (!localStorage.getItem('popupShown')) {
        document.getElementById('popupOverlay');
        localStorage.setItem('popupShown', 'true');
    }
};



