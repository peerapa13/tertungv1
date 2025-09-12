// -------------------------
// State management
// -------------------------
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");

function getImagesFromStorage() {
  return JSON.parse(localStorage.getItem('uploadedImages')) || [];
}

function saveImagesToStorage(images) {
  localStorage.setItem('uploadedImages', JSON.stringify(images));
}

function addImageToStorage(imgObj) {
  const images = getImagesFromStorage();
  images.push(imgObj);
  saveImagesToStorage(images);
}

// -------------------------
// Upload
// -------------------------
async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "imgweb");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/dmdhq3u7b/image/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    const imgObj = {
      publicId: data.public_id,
      url: data.secure_url,
      status: "ready" // default
    };
    addImageToStorage(imgObj);
    renderImages();
    return imgObj;
  } catch (err) {
    console.error("Upload failed:", err);
    alert("เกิดข้อผิดพลาดในการอัปโหลด");
    return null;
  }
}

// -------------------------
// Render
// -------------------------
function renderImages() {
  uploadArea.innerHTML = "";
  const images = getImagesFromStorage();

  images.forEach(imgObj => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("image-wrapper");

    const img = document.createElement("img");
    img.src = imgObj.url;
    wrapper.appendChild(img);

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerHTML = "×";
    deleteBtn.addEventListener("click", () => deleteImage(imgObj.publicId));
    wrapper.appendChild(deleteBtn);

    uploadArea.appendChild(wrapper);
  });
}

// -------------------------
// Delete
// -------------------------
function deleteImage(publicId) {
  let images = getImagesFromStorage();
  images = images.filter(img => img.publicId !== publicId);
  saveImagesToStorage(images);
  renderImages();
}

function deleteAllImages() {
  saveImagesToStorage([]);
  uploadArea.innerHTML = "";
  fileInput.value = "";
}

// -------------------------
// Process images (Cloudinary effects)
// -------------------------
async function processImages(effect) {
  let images = getImagesFromStorage();
  for (let img of images) {
    const imageUrl = `https://res.cloudinary.com/dmdhq3u7b/image/upload/${effect}/${img.publicId}`;
    
    // เช็คว่าภาพพร้อม
    let retries = 10;
    let isReady = false;
    while (retries > 0 && !isReady) {
      const res = await fetch(imageUrl, { method: 'HEAD' });
      if (res.ok) isReady = true;
      else {
        retries--;
        await new Promise(r => setTimeout(r, 250));
      }
    }

    if (isReady) img.url = imageUrl;
  }
  saveImagesToStorage(images);
  renderImages();
}

// -------------------------
// Download all
// -------------------------
async function downloadAllImages() {
  const images = getImagesFromStorage();
  if (!images.length) return alert("ไม่มีภาพให้ดาวน์โหลด");

  for (let i = 0; i < images.length; i++) {
    const res = await fetch(images[i].url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `image_${i + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    await new Promise(r => setTimeout(r, 300));
  }
}

// -------------------------
// Event listeners
// -------------------------
uploadArea.addEventListener("click", e => {
  if (e.target === uploadArea) fileInput.click();
});

fileInput.addEventListener("change", e => {
  const files = Array.from(e.target.files);
  files.forEach(file => uploadImage(file));
});

document.getElementById("removeAll").addEventListener("click", deleteAllImages);
document.getElementById("removebg").addEventListener("click", () => processImages("e_background_removal"));
document.getElementById("Enhancingimages").addEventListener("click", () => processImages("e_enhance"));
document.getElementById("downloadAll").addEventListener("click", downloadAllImages);

// -------------------------
// Popup & init
// -------------------------
window.onload = function() {
  renderImages();
  if (!localStorage.getItem('popupShown')) {
    document.getElementById('popupOverlay').style.display = 'block';
    localStorage.setItem('popupShown', 'true');
  }
};
