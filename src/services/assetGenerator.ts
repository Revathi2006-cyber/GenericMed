import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateProjectAssets() {
  try {
    // 1. Generate Logo
    const logoResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: "A modern, minimalist 1:1 square logo for a healthcare app named 'GenericMed'. The logo features a stylized medical capsule integrated with a digital scan line, symbolizing AI scanning and transparency. Professional color palette: emerald green and deep slate on a clean white background. No small text, bold and iconic.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    // 2. Generate Showcase Image
    const showcaseResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: "A high-quality, professional showcase image for the 'GenericMed' app. A person is holding a smartphone, scanning a medical prescription. The app interface on the phone screen shows a side-by-side comparison of a branded medicine and a generic alternative with a bright 'Save 80%' badge. Modern, clean healthcare environment background, cinematic lighting.",
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    return {
      logo: logoResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data,
      showcase: showcaseResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data,
    };
  } catch (error) {
    console.error("Error generating assets:", error);
    return null;
  }
}
