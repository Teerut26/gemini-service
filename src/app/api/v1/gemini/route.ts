import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

export const POST = async (req: Request) => {
  try {
    const formData = await req.formData();

    const system_instruction = formData.get("system_instruction") as string;
    const token = formData.get("token") as string;
    const content = formData.get("content") as string;
    const file = formData.get("file") as unknown as File;
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    if (token.length === 0) {
      throw new Error("Token is required");
    }

    const apiKey = token;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: system_instruction,
    });

    const parts: Part[] = [];

    if (file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      parts.push({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      });
    } else if (content.length > 0) {
      parts.push({
        text: content,
      });
    } else {
      throw new Error("Content or file is required");
    }

    const chatSession = model.startChat({
      generationConfig,
    });

    const result = await chatSession.sendMessage(parts);

    return Response.json({ content: result.response.text() });
  } catch (err) {
    if (err instanceof Error) {
      return Response.json({ message: err.message }, { status: 400 });
    }
    return Response.json({ message: "SOMETHING_WENT_WRONG" }, { status: 400 });
  }
};
