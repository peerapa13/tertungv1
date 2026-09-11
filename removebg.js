// ==================== removebg.js ====================
// ใช้ @imgly/background-removal (runs in-browser via WASM, ฟรี ไม่ต้อง API key)
// Fallback: canvas pixel-based (ลบสีพื้นหลังด้วย color distance)

/**
 * ลบพื้นหลังภาพทั้งหมดใน .image-wrapper
 * @param {IDBDatabase} db - IndexedDB instance
 * @param {object} options - { useAI: true/false, bgColor: [r,g,b], threshold: number }
 */
async function removeBackgroundFromAllImages(db, options = {}) {
    const {
        useAI = true,
        bgColor = [255, 255, 255],
        threshold = 40
    } = options;

    const wrappers = document.querySelectorAll(".image-wrapper");
    if (wrappers.length === 0) {
        alert("ไม่มีรูปภาพให้ประมวลผล");
        return;
    }

    for (const wrapper of wrappers) {
        const img = wrapper.querySelector("img");
        let newBase64;

        try {
            if (useAI) {
                newBase64 = await _removeBgWithAI(img);
            } else {
                newBase64 = await _removeBgWithCanvas(img, bgColor, threshold);
            }
        } catch (err) {
            console.warn("AI removal ล้มเหลว, ใช้ canvas fallback:", err);
            newBase64 = await _removeBgWithCanvas(img, bgColor, threshold);
        }

        img.src = newBase64;
        // อัปเดต DB
        await _saveProcessedToDB(db, wrapper, newBase64);
    }
}

/**
 * ลบพื้นหลังด้วย AI (@imgly/background-removal CDN)
 * รัน in-browser ผ่าน WebAssembly ไม่ต้องการ API key
 */
async function _removeBgWithAI(imgEl) {
    if (!window.__imglyRemoveBackgroundPromise) {
        window.__imglyRemoveBackgroundPromise = import(
            "https://esm.sh/@imgly/background-removal@1.4.5"
        ).then(module => module.removeBackground);
    }
    const removeBackground = await window.__imglyRemoveBackgroundPromise;

    // แปลง img element → Blob
    const blob = await _imgElToBlob(imgEl);
    const resultBlob = await removeBackground(blob, {
        model: "small", // "small" เร็วกว่า, "medium" แม่นกว่า
        output: { format: "image/png" }
    });

    return await _blobToBase64(resultBlob);
}

/**
 * ลบพื้นหลังด้วย canvas pixel-based (วิธีเดิม แต่รองรับ bgColor ที่กำหนดเอง)
 */
async function _removeBgWithCanvas(imgEl, bgColor = [255, 255, 255], threshold = 40) {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = imgEl.naturalWidth || imgEl.width;
        canvas.height = imgEl.naturalHeight || imgEl.height;
        ctx.drawImage(imgEl, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const distance = Math.sqrt(
                (r - bgColor[0]) ** 2 +
                (g - bgColor[1]) ** 2 +
                (b - bgColor[2]) ** 2
            );
            if (distance < threshold) data[i + 3] = 0;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
    });
}

/**
 * บันทึก processed image ลง IndexedDB
 * ใช้ "processedImages" store แยกจาก "images" store เดิม
 */
async function _saveProcessedToDB(db, wrapper, base64) {
    if (!wrapper.dataset.id) return;
    const id = Number(wrapper.dataset.id);

    // ถ้า db มี processedImages store ให้เซฟแยก, ไม่งั้น overwrite images store
    const storeNames = Array.from(db.objectStoreNames);
    const storeName = storeNames.includes("processedImages") ? "processedImages" : "images";

    return new Promise((resolve) => {
        const tx = db.transaction(storeName, "readwrite");
        const req = tx.objectStore(storeName).put({ id, data: base64 });
        req.onsuccess = () => resolve();
        req.onerror = () => resolve(); // ไม่ block แม้ error
    });
}

// ==================== Utility functions ====================

function _loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(); return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

function _imgElToBlob(imgEl) {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = imgEl.naturalWidth || imgEl.width;
        canvas.height = imgEl.naturalHeight || imgEl.height;
        canvas.getContext("2d").drawImage(imgEl, 0, 0);
        canvas.toBlob(resolve, "image/png");
    });
}

function _blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}
