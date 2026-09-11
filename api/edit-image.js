const OPENAI_URL = "https://api.openai.com/v1/images/edits";

function dataUrlToBlob(dataUrl) {
    const match = /^data:(.+);base64,(.+)$/.exec(dataUrl || "");
    if (!match) throw new Error("รูปภาพไม่อยู่ในรูปแบบที่รองรับ");
    return new Blob([Buffer.from(match[2], "base64")], { type: match[1] });
}

export default async function handler(request, response) {
    response.setHeader("Access-Control-Allow-Origin", "https://peerapa13.github.io");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (request.method === "OPTIONS") return response.status(204).end();
    if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { image, mask, prompt } = request.body || {};
        if (!image || !prompt?.trim()) {
            return response.status(400).json({ error: "ต้องระบุภาพและพร็อมต์" });
        }
        if (!process.env.OPENAI_API_KEY) {
            return response.status(500).json({ error: "ยังไม่ได้ตั้งค่า OPENAI_API_KEY ใน Vercel" });
        }

        const form = new FormData();
        form.append("model", "gpt-image-1");
        form.append("prompt", prompt.trim());
        form.append("image", dataUrlToBlob(image), "image.png");
        if (mask) form.append("mask", dataUrlToBlob(mask), "mask.png");

        const openAiResponse = await fetch(OPENAI_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            body: form
        });
        const data = await openAiResponse.json();
        if (!openAiResponse.ok) {
            return response.status(openAiResponse.status).json({
                error: data.error?.message || "OpenAI แก้ภาพไม่สำเร็จ"
            });
        }
        const imageData = data.data?.[0]?.b64_json;
        if (!imageData) return response.status(502).json({ error: "OpenAI ไม่ได้ส่งภาพกลับมา" });
        return response.status(200).json({ image: `data:image/png;base64,${imageData}` });
    } catch (error) {
        console.error("edit-image error:", error);
        return response.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
    }
}
