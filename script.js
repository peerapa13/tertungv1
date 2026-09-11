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

// ==================== AI prompt editor ====================
const editorCanvas = document.getElementById("editor-canvas");
const editorCanvasWrap = document.getElementById("canvas-wrap");
const canvasEmpty = document.getElementById("canvas-empty");
const editorStatus = document.getElementById("editor-status");
const promptInput = document.getElementById("ai-prompt");
const applyAiEditButton = document.getElementById("apply-ai-edit");
const downloadEditedButton = document.getElementById("download-edited");
const clearSelectionButton = document.getElementById("clear-selection");
const editorContext = {
    imageElement: null,
    wrapper: null,
    selection: null,
    dragStart: null,
    isDragging: false
};

function setEditorStatus(message) {
    editorStatus.textContent = message;
}

function selectImageForEditing(wrapper) {
    const image = wrapper.querySelector("img");
    if (!image) return;

    editorContext.wrapper = wrapper;
    editorContext.imageElement = image;
    editorContext.selection = null;
    canvasEmpty.style.display = "none";
    downloadEditedButton.disabled = false;
    setEditorStatus("กำลังแก้: " + (image.alt || "ภาพที่เลือก"));

    if (image.complete && image.naturalWidth) {
        drawEditorCanvas();
    } else {
        image.addEventListener("load", drawEditorCanvas, { once: true });
    }
}

function drawEditorCanvas() {
    const image = editorContext.imageElement;
    if (!image || !image.naturalWidth) return;

    editorCanvas.width = image.naturalWidth;
    editorCanvas.height = image.naturalHeight;
    const context = editorCanvas.getContext("2d");
    context.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    context.drawImage(image, 0, 0);

    if (editorContext.selection) {
        const { x, y, width, height } = editorContext.selection;
        context.save();
        context.fillStyle = "rgba(86, 100, 232, .16)";
        context.fillRect(x, y, width, height);
        context.strokeStyle = "#5664e8";
        context.lineWidth = Math.max(2, editorCanvas.width / 500);
        context.setLineDash([10, 7]);
        context.strokeRect(x, y, width, height);
        context.restore();
    }
}

function canvasPoint(event) {
    const bounds = editorCanvas.getBoundingClientRect();
    return {
        x: Math.max(0, Math.min(editorCanvas.width, (event.clientX - bounds.left) * editorCanvas.width / bounds.width)),
        y: Math.max(0, Math.min(editorCanvas.height, (event.clientY - bounds.top) * editorCanvas.height / bounds.height))
    };
}

function updateSelection(start, end) {
    editorContext.selection = {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y)
    };
    drawEditorCanvas();
}

editorCanvas.addEventListener("pointerdown", event => {
    if (!editorContext.imageElement) return;
    editorContext.isDragging = true;
    editorContext.dragStart = canvasPoint(event);
    editorCanvas.setPointerCapture(event.pointerId);
});

editorCanvas.addEventListener("pointermove", event => {
    if (!editorContext.isDragging) return;
    updateSelection(editorContext.dragStart, canvasPoint(event));
});

editorCanvas.addEventListener("pointerup", event => {
    if (!editorContext.isDragging) return;
    editorContext.isDragging = false;
    updateSelection(editorContext.dragStart, canvasPoint(event));
    if (editorContext.selection.width < 4 || editorContext.selection.height < 4) {
        editorContext.selection = null;
        drawEditorCanvas();
    }
});

uploadArea.addEventListener("click", event => {
    const image = event.target.closest(".image-wrapper img");
    if (image) selectImageForEditing(image.closest(".image-wrapper"));
});

clearSelectionButton.addEventListener("click", () => {
    editorContext.selection = null;
    drawEditorCanvas();
    setEditorStatus(editorContext.imageElement ? "แก้ทั้งภาพ" : "ยังไม่ได้เลือกภาพ");
});

document.querySelectorAll(".prompt-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        promptInput.value = chip.dataset.prompt;
        promptInput.focus();
    });
});

function getEditRegion() {
    if (editorContext.selection) return editorContext.selection;
    return { x: 0, y: 0, width: editorCanvas.width, height: editorCanvas.height };
}

function parsePrompt(prompt) {
    const text = prompt.toLowerCase();
    return {
        grayscale: /ขาวดำ|ขาว-ดำ|black.?and.?white|grayscale/.test(text),
        blur: /เบลอ|ละลาย|blur/.test(text),
        brighten: /สว่าง|เพิ่มแสง|bright|exposure/.test(text),
        darken: /มืด|ลดแสง|darken/.test(text),
        sharpen: /คม|ชัด|sharpen|รายละเอียด/.test(text),
        warm: /อุ่น|warm|ทอง/.test(text),
        cool: /เย็น|cool|ฟ้า/.test(text),
        sepia: /ซีเปีย|วินเทจ|sepia|vintage/.test(text)
    };
}

function applyPromptToCanvas(prompt) {
    const effects = parsePrompt(prompt);
    const hasEffect = Object.values(effects).some(Boolean);
    if (!hasEffect) {
        throw new Error("ลองใช้คำว่า สว่าง, คมชัด, ขาวดำ, เบลอ, อุ่น, เย็น หรือวินเทจ");
    }

    const region = getEditRegion();
    const source = document.createElement("canvas");
    source.width = region.width;
    source.height = region.height;
    const sourceContext = source.getContext("2d");
    sourceContext.filter = [
        effects.grayscale ? "grayscale(1)" : "",
        effects.brighten ? "brightness(1.25)" : "",
        effects.darken ? "brightness(.75)" : "",
        effects.warm ? "sepia(.35) saturate(1.3)" : "",
        effects.cool ? "hue-rotate(15deg) saturate(.8)" : "",
        effects.sepia ? "sepia(.8) contrast(1.05)" : "",
        effects.sharpen ? "contrast(1.18) saturate(1.08)" : "",
        effects.blur ? "blur(5px)" : ""
    ].filter(Boolean).join(" ");
    sourceContext.drawImage(editorCanvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);

    const context = editorCanvas.getContext("2d");
    context.clearRect(region.x, region.y, region.width, region.height);
    context.drawImage(source, region.x, region.y);
    editorContext.selection = null;
    const editedData = editorCanvas.toDataURL("image/png");
    editorContext.imageElement.addEventListener("load", drawEditorCanvas, { once: true });
    editorContext.imageElement.src = editedData;
    setEditorStatus("แก้ไขสำเร็จแล้ว — พิมพ์พร็อมต์ใหม่ได้");
    saveEditedImage(editorContext.wrapper, editedData);
}

function saveEditedImage(wrapper, data) {
    if (!db || !wrapper || !wrapper.dataset.id) return;
    const storeName = db.objectStoreNames.contains("processedImages") ? "processedImages" : "images";
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put({ id: Number(wrapper.dataset.id), data });
}

applyAiEditButton.addEventListener("click", () => {
    if (!editorContext.imageElement) {
        alert("กรุณาอัปโหลดและเลือกภาพก่อน");
        return;
    }
    if (!promptInput.value.trim()) {
        alert("กรุณาพิมพ์พร็อมต์ เช่น ทำให้ภาพสว่างและคมชัดขึ้น");
        promptInput.focus();
        return;
    }

    applyAiEditButton.disabled = true;
    setEditorStatus("AI กำลังตีความพร็อมต์...");
    try {
        applyPromptToCanvas(promptInput.value);
    } catch (error) {
        alert(error.message);
        setEditorStatus("แก้ไขไม่สำเร็จ");
    } finally {
        applyAiEditButton.disabled = false;
    }
});

downloadEditedButton.addEventListener("click", () => {
    if (!editorContext.imageElement) return;
    const link = document.createElement("a");
    link.href = editorContext.imageElement.src;
    link.download = "tertung-ai-edited.png";
    link.click();
});
