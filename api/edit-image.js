const GEMINI_MODEL = "gemini-2.5-flash-image";

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
        if (!process.env.GEMINI_API_KEY) {
            return response.status(500).json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Vercel" });
        }

        const imageMatch = /^data:(.+);base64,(.+)$/.exec(image);
        if (!imageMatch) throw new Error("รูปภาพไม่อยู่ในรูปแบบที่รองรับ");
        const parts = [{
            text: mask
                ? `${prompt.trim()}\nแก้เฉพาะบริเวณที่ไฮไลต์ในภาพ mask ที่แนบมา ส่วนอื่นของภาพต้องคงเดิม`
                : prompt.trim()
        }, {
            inline_data: { mime_type: imageMatch[1], data: imageMatch[2] }
        }];
        if (mask) {
            const maskMatch = /^data:(.+);base64,(.+)$/.exec(mask);
            if (maskMatch) parts.push({
                inline_data: { mime_type: maskMatch[1], data: maskMatch[2] }
            });
        }

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
            {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts }],
                generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
            })
        });
        const data = await geminiResponse.json();
        if (!geminiResponse.ok) {
            return response.status(geminiResponse.status).json({
                error: data.error?.message || "Gemini แก้ภาพไม่สำเร็จ"
            });
        }
        const imagePart = data.candidates?.[0]?.content?.parts?.find(
            part => part.inlineData || part.inline_data
        );
        const imageData = imagePart?.inlineData || imagePart?.inline_data;
        if (!imageData?.data) return response.status(502).json({ error: "Gemini ไม่ได้ส่งภาพกลับมา" });
        return response.status(200).json({
            image: `data:${imageData.mimeType || imageData.mime_type || "image/png"};base64,${imageData.data}`
        });
    } catch (error) {
        console.error("edit-image error:", error);
        return response.status(500).json({ error: error.message || "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
    }
}
