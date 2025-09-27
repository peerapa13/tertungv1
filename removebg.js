function removeBackground(imgElement, bgColor=[255,255,255], threshold=30) {
    // สร้าง canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    
    ctx.drawImage(imgElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        // คำนวณระยะห่างสี Euclidean distance
        const distance = Math.sqrt(
            (r - bgColor[0])**2 +
            (g - bgColor[1])**2 +
            (b - bgColor[2])**2
        );
        
        if (distance < threshold) {
            data[i+3] = 0; // Alpha = 0 → โปร่งใส
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // สร้างรูปใหม่
    const resultImg = new Image();
    resultImg.src = canvas.toDataURL("image/png");
    return resultImg;
}
