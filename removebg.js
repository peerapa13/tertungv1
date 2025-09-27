function removeBackgroundFromAllImages(db, bgColor=[255,255,255], threshold=40){
    const wrappers = document.querySelectorAll(".image-wrapper");
    wrappers.forEach(wrapper => {
        const img = wrapper.querySelector("img");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img,0,0);

        const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
        const data = imageData.data;

        for(let i=0;i<data.length;i+=4){
            const r = data[i], g = data[i+1], b = data[i+2];
            const distance = Math.sqrt((r-bgColor[0])**2 + (g-bgColor[1])**2 + (b-bgColor[2])**2);
            if(distance < threshold) data[i+3] = 0;
        }

        ctx.putImageData(imageData,0,0);
        const newBase64 = canvas.toDataURL("image/png");
        img.src = newBase64;

        // อัปเดต IndexedDB
        if(wrapper.dataset.id){
            const tx = db.transaction("images","readwrite");
            const store = tx.objectStore("images");
            store.put({ id:Number(wrapper.dataset.id), data:newBase64 });
        }
    });
}
