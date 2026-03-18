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
  usageInstructions?: string;
  precautions?: string[];
  whenToConsultDoctor?: string[];
  boundingBox?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  complementaryCare?: {
    homeRemedies: string[];
    ayurvedaSuggestions: { herb: string; benefit: string }[];
  };
}

export async function analyzePrescription(base64Image: string): Promise<MedicineResult[]> {
  try {
    const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
    const base64Data = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this prescription. Extract the branded medicine names. For each branded medicine, provide its generic equivalent, the salt composition, an estimated price in INR (₹) for the branded version, and an estimated price in INR (₹) for the generic version. Calculate the savings. Also provide common side effects, potential drug interactions, detailed usage instructions, key precautions, and specific red flags for when to consult a doctor. Provide complementary care suggestions (home remedies and light ayurvedic suggestions) based on the likely condition being treated. Return the bounding box of the medicine name on the prescription image in the format [ymin, xmin, ymax, xmax] where values are normalized from 0 to 1000. Return the data as a JSON array of objects.",
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
              },
              usageInstructions: { type: Type.STRING, description: "Detailed instructions on how to take the medicine" },
              precautions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key precautions to take while on this medication"
              },
              whenToConsultDoctor: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Red flags or symptoms that require immediate medical attention"
              },
              boundingBox: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: "Bounding box of the medicine name [ymin, xmin, ymax, xmax] normalized 0-1000"
              },
              complementaryCare: {
                type: Type.OBJECT,
                description: "Supportive lifestyle and complementary care suggestions",
                properties: {
                  homeRemedies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of home remedies or lifestyle changes"
                  },
                  ayurvedaSuggestions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        herb: { type: Type.STRING },
                        benefit: { type: Type.STRING }
                      },
                      required: ["herb", "benefit"]
                    },
                    description: "List of light ayurvedic suggestions"
                  }
                },
                required: ["homeRemedies", "ayurvedaSuggestions"]
              }
            },
            required: ["brandedName", "genericName", "saltComposition", "brandedPrice", "genericPrice", "savings", "sideEffects", "interactions", "usageInstructions", "precautions", "whenToConsultDoctor"],
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
            text: `Find the generic equivalent for the medicine: "${query}". Provide its generic equivalent, the salt composition, an estimated price in INR (₹) for the branded version, and an estimated price in INR (₹) for the generic version. Calculate the savings. Also provide common side effects, potential drug interactions, detailed usage instructions, key precautions, and specific red flags for when to consult a doctor. Provide complementary care suggestions (home remedies and light ayurvedic suggestions) based on the likely condition being treated. Return the data as a JSON array of objects.`,
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
              },
              usageInstructions: { type: Type.STRING, description: "Detailed instructions on how to take the medicine" },
              precautions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key precautions to take while on this medication"
              },
              whenToConsultDoctor: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Red flags or symptoms that require immediate medical attention"
              },
              complementaryCare: {
                type: Type.OBJECT,
                description: "Supportive lifestyle and complementary care suggestions",
                properties: {
                  homeRemedies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of home remedies or lifestyle changes"
                  },
                  ayurvedaSuggestions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        herb: { type: Type.STRING },
                        benefit: { type: Type.STRING }
                      },
                      required: ["herb", "benefit"]
                    },
                    description: "List of light ayurvedic suggestions"
                  }
                },
                required: ["homeRemedies", "ayurvedaSuggestions"]
              }
            },
            required: ["brandedName", "genericName", "saltComposition", "brandedPrice", "genericPrice", "savings", "sideEffects", "interactions", "usageInstructions", "precautions", "whenToConsultDoctor"],
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
