import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MedicineResult {
  brandedName: string;
  genericName: string;
  saltComposition: string;
  brandedPrice: number;
  genericPrice: number;
  savings: number;
  sideEffects: string[];
  interactions: string[];
}

export async function analyzePrescription(base64Image: string): Promise<MedicineResult[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: "image/jpeg",
            },
          },
          {
            text: "Analyze this prescription. Extract the branded medicine names. For each branded medicine, provide its generic equivalent, the salt composition, an estimated price in INR (₹) for the branded version, and an estimated price in INR (₹) for the generic version. Calculate the savings. Also provide common side effects and potential drug interactions. Return the data as a JSON array of objects.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brandedName: { type: Type.STRING, description: "Name of the branded medicine" },
              genericName: { type: Type.STRING, description: "Name of the generic equivalent" },
              saltComposition: { type: Type.STRING, description: "Active ingredient / salt composition" },
              brandedPrice: { type: Type.NUMBER, description: "Estimated price of branded medicine in INR" },
              genericPrice: { type: Type.NUMBER, description: "Estimated price of generic medicine in INR" },
              savings: { type: Type.NUMBER, description: "Difference between branded and generic price" },
              sideEffects: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of common side effects"
              },
              interactions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of potential drug or food interactions"
              }
            },
            required: ["brandedName", "genericName", "saltComposition", "brandedPrice", "genericPrice", "savings", "sideEffects", "interactions"],
          },
        },
      },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) return [];
    
    return JSON.parse(jsonStr) as MedicineResult[];
  } catch (error) {
    console.error("Error analyzing prescription:", error);
    throw new Error("Failed to analyze prescription. Please try again.");
  }
}

export async function searchMedicine(query: string): Promise<MedicineResult[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            text: `Find the generic equivalent for the medicine: "${query}". Provide its generic equivalent, the salt composition, an estimated price in INR (₹) for the branded version, and an estimated price in INR (₹) for the generic version. Calculate the savings. Also provide common side effects and potential drug interactions. Return the data as a JSON array of objects.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              brandedName: { type: Type.STRING, description: "Name of the branded medicine" },
              genericName: { type: Type.STRING, description: "Name of the generic equivalent" },
              saltComposition: { type: Type.STRING, description: "Active ingredient / salt composition" },
              brandedPrice: { type: Type.NUMBER, description: "Estimated price of branded medicine in INR" },
              genericPrice: { type: Type.NUMBER, description: "Estimated price of generic medicine in INR" },
              savings: { type: Type.NUMBER, description: "Difference between branded and generic price" },
              sideEffects: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of common side effects"
              },
              interactions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of potential drug or food interactions"
              }
            },
            required: ["brandedName", "genericName", "saltComposition", "brandedPrice", "genericPrice", "savings", "sideEffects", "interactions"],
          },
        },
      },
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) return [];
    
    return JSON.parse(jsonStr) as MedicineResult[];
  } catch (error) {
    console.error("Error searching medicine:", error);
    throw new Error("Failed to search medicine. Please try again.");
  }
}
