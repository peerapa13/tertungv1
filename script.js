 // ฟังก์ชันแสดง popup ตอนโหลดหน้า
 window.onload = function() {
    document.getElementById('popupOverlay').style.display = 'block';
};

// ฟังก์ชันปิด popup
function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
}

function showPopup() {
document.getElementById('popupOverlay').style.display = 'block';
}

// ฟังก์ชันปิด Popup
function closePopup() {
document.getElementById('popupOverlay').style.display = 'none';
}


// ฟังก์ชันสำหรับแสดงภาพ
const uploadArea = document.getElementById("upload-area");
const fileInput = document.getElementById("file-input");
function displayImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imageWrapper = document.createElement("div");
        imageWrapper.classList.add("image-wrapper");

        const img = document.createElement("img");
        img.src = e.target.result;

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.innerHTML = "×";

        deleteBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            uploadArea.removeChild(imageWrapper);
        });

        imageWrapper.appendChild(img);
        imageWrapper.appendChild(deleteBtn);
        uploadArea.appendChild(imageWrapper);
    };
    reader.readAsDataURL(file);
}

// การจัดการเมื่อคลิกพื้นที่อัปโหลด
uploadArea.addEventListener("click", (event) => {
    if (event.target === uploadArea) {
        fileInput.click();
    }
});

// การจัดการเมื่อเลือกไฟล์ผ่าน input
fileInput.addEventListener("change", (e) => {
    const files = e.target.files;

    Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
            displayImage(file);
        }
    });
});


/*ปุ่มแก้ไข*/
document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData();
    const fileInput = document.getElementById('file-input');

    // ตรวจสอบว่าผู้ใช้เลือกไฟล์หรือไม่
    if (fileInput.files.length === 0) {
        alert('กรุณาเลือกไฟล์ก่อนอัปโหลด');
        return;
    }

    formData.append('image', fileInput.files[0]);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('การอัปโหลดล้มเหลว');
        }

        const result = await response.json();
        alert('อัปโหลดสำเร็จ: ' + result.message);
    } catch (error) {
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const editButton = document.getElementById('edit-button');

    // ตรวจสอบว่า editButton มีอยู่จริง
    if (editButton) {
        editButton.addEventListener('click', () => {
            // เปลี่ยนเส้นทางไปยังหน้าใหม่
            window.location.href = './main.html'; // เปลี่ยนหน้า
        });
    } else {
        console.error('ไม่พบปุ่ม edit-button');
    }
});
