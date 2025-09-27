// removebg.js
function removeBackgroundFromAllImages(bgColor=[255,255,255], threshold=40) {
    const wrappers = document.querySelectorAll(".image-wrapper img");
    wrappers.forEach(img => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            const distance = Math.sqrt(
                (r - bgColor[0])**2 +
                (g - bgColor[1])**2 +
                (b - bgColor[2])**2
            );
            if (distance < threshold) data[i+3] = 0;
        }

        ctx.putImageData(imageData, 0, 0);
        img.src = canvas.toDataURL("image/png");
    });
}
