const https = require('https');
const fs = require('fs');

// Please replace with your own apiKey
const apiKey = 'sandbox_9ee18156a94adc52b531943f4670a02e3d70e59c';

async function removeBackground(imagePath, savePath) {
    return new Promise((resolve, reject) => {
        const boundary = '--------------------------' + Date.now().toString(16);
        
        const postOptions = {
            hostname: 'sdk.photoroom.com',
            path: '/v1/segment',
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'X-API-Key': apiKey
            }
        };

        const req = https.request(postOptions, (res) => {
            // Check if the response is an image
            const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(res.headers['content-type']);

            if (!isImage) {
                let errorData = '';
                res.on('data', (chunk) => errorData += chunk);
                res.on('end', () => reject(new Error(`Expected an image response, but received: ${errorData}`)));
                return;
            }

            // Create a write stream to save the image
            const fileStream = fs.createWriteStream(savePath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                resolve(`Image saved to ${savePath}`);
            });

            fileStream.on('error', (error) => {
                reject(new Error(`Failed to save the image: ${error.message}`));
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        // Write form data
        req.write(`--${boundary}\r\n`);
        req.write(`Content-Disposition: form-data; name="image_file"; filename="${imagePath.split('/').pop()}"\r\n`);
        req.write('Content-Type: image/jpeg\r\n\r\n'); // assuming JPEG, adjust if another format is used

        const uploadStream = fs.createReadStream(imagePath);
        uploadStream.on('end', () => {
            req.write('\r\n');
            req.write(`--${boundary}--\r\n`);
            req.end();
        });
        
        uploadStream.pipe(req, { end: false });
    });
}

module.exports = removeBackground;