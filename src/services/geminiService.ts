import { GoogleGenAI, Type } from "@google/genai";

function getAi() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please set GEMINI_API_KEY in your Render environment variables and trigger a NEW DEPLOY (Clear Build Cache & Deploy).");
  }
  return new GoogleGenAI({ apiKey });
}

export interface OnlinePrice {
  pharmacy: string;
  price: number;
  link: string;
  domain?: string;
  logoUrl?: string;
}

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
  onlinePrices?: OnlinePrice[];
}

async function fetchWithRetry(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error.message?.includes("429") || error.status === 429;
    if (isRateLimit && retries > 0) {
      console.warn(`Gemini API rate limit hit, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function analyzePrescription(base64Image: string): Promise<MedicineResult[]> {
  // Simple hash for the image to use as a cache key
  const imageHash = base64Image.substring(0, 100) + base64Image.length;
  const cacheKey = `analysis_${imageHash}`;
  
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 days cache
        return parsed.data;
      }
    } catch (e) {
      console.error("Cache parse error", e);
    }
  }

  try {
    const ai = getAi();
    const mimeTypeMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
    const base64Data = base64Image.split(',')[1];

    const result = await fetchWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: "Analyze this prescription. Extract the branded medicine names. For each branded medicine, provide its generic equivalent, the salt composition, an estimated price in INR (₹) for the branded version, and an estimated price in INR (₹) for the generic version. Calculate the savings. Also provide common side effects, potential drug interactions, detailed usage instructions, key precautions, and specific red flags for when to consult a doctor. Provide complementary care suggestions (home remedies and light ayurvedic suggestions) based on the likely condition being treated. Additionally, find current online prices and direct purchase links for the generic version from major Indian pharmacies like Apollo Pharmacy, Tata 1mg, Netmeds, and PharmEasy. Return the bounding box of the medicine name on the prescription image in the format [ymin, xmin, ymax, xmax] where values are normalized from 0 to 1000. Return the data as a JSON array of objects. If no medicines are found, return an empty array [].",
            },
          ],
        },
        config: {
          tools: [{ googleSearch: {} }],
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
                },
                onlinePrices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      pharmacy: { type: Type.STRING, description: "Name of the pharmacy (e.g., Tata 1mg)" },
                      price: { type: Type.NUMBER, description: "Price in INR" },
                      link: { type: Type.STRING, description: "Direct URL to the medicine on the pharmacy website" },
                      domain: { type: Type.STRING, description: "Official website domain (e.g., 1mg.com)" },
                      logoUrl: { type: Type.STRING, description: "Direct URL to the pharmacy logo" }
                    },
                    required: ["pharmacy", "price", "link", "domain"]
                  },
                  description: "List of online prices from different pharmacies"
                }
              },
              required: ["brandedName", "genericName", "saltComposition", "brandedPrice", "genericPrice", "savings", "sideEffects", "interactions", "usageInstructions", "precautions", "whenToConsultDoctor"],
            },
          },
        },
      });
      return response;
    });

    let jsonStr = result.text?.trim() || "";
    
    // Clean up markdown if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    if (!jsonStr) return [];
    
    try {
      const data = JSON.parse(jsonStr) as MedicineResult[];
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
      return data;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw string:", jsonStr);
      throw new Error("Failed to parse analysis results. Please try again.");
    }
  } catch (error: any) {
    console.error("Error analyzing prescription:", error);
    if (error.message?.includes("API key")) {
      throw new Error("Invalid API key. Please check your settings. Ensure you have set GEMINI_API_KEY in Render environment variables.");
    }
    if (error.message?.includes("quota") || error.message?.includes("429") || error.status === 429) {
      throw new Error("API Quota Exceeded. The free tier of Gemini API has limits. \n\nTo fix this:\n1. Upgrade to a paid plan at ai.google.dev.\n2. If you just updated your key, you MUST go to Render -> Manual Deploy -> 'Clear Build Cache & Deploy' to pick up the changes.");
    }
    throw new Error("Failed to analyze prescription. Please ensure the photo is clear and try again.");
  }
}

export async function searchMedicine(query: string): Promise<MedicineResult[]> {
  const cacheKey = `search_${query.toLowerCase().trim()}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 30 * 24 * 60 * 60 * 1000) { // 30 days cache for generic searches
        return parsed.data;
      }
    } catch (e) {
      console.error("Cache parse error", e);
    }
  }

  try {
    const ai = getAi();
    const result = await fetchWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              text: `Find the generic equivalent for the medicine: "${query}". Provide its generic equivalent, the salt composition, an estimated price in INR (₹) for the branded version, and an estimated price in INR (₹) for the generic version. Calculate the savings. Also provide common side effects, potential drug interactions, detailed usage instructions, key precautions, and specific red flags for when to consult a doctor. Provide complementary care suggestions (home remedies and light ayurvedic suggestions) based on the likely condition being treated. Additionally, find current online prices and direct purchase links for the generic version from major Indian pharmacies like Apollo Pharmacy, Tata 1mg, Netmeds, and PharmEasy. Return the data as a JSON array of objects.`,
            },
          ],
        },
        config: {
          tools: [{ googleSearch: {} }],
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
                },
                onlinePrices: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      pharmacy: { type: Type.STRING, description: "Name of the pharmacy (e.g., Tata 1mg)" },
                      price: { type: Type.NUMBER, description: "Price in INR" },
                      link: { type: Type.STRING, description: "Direct URL to the medicine on the pharmacy website" },
                      domain: { type: Type.STRING, description: "Official website domain (e.g., 1mg.com)" },
                      logoUrl: { type: Type.STRING, description: "Direct URL to the pharmacy logo" }
                    },
                    required: ["pharmacy", "price", "link", "domain"]
                  },
                  description: "List of online prices from different pharmacies"
                }
              },
              required: ["brandedName", "genericName", "saltComposition", "brandedPrice", "genericPrice", "savings", "sideEffects", "interactions", "usageInstructions", "precautions", "whenToConsultDoctor"],
            },
          },
        },
      });
      return response;
    });

    let jsonStr = result.text?.trim() || "";
    
    // Clean up markdown if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    if (!jsonStr) return [];
    
    try {
      const data = JSON.parse(jsonStr) as MedicineResult[];
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
      return data;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw string:", jsonStr);
      throw new Error("Failed to parse search results. Please try again.");
    }
  } catch (error: any) {
    console.error("Error searching medicine:", error);
    if (error.message?.includes("API key")) {
      throw new Error("Invalid API key. Please check your settings. Ensure you have set GEMINI_API_KEY in Render environment variables.");
    }
    if (error.message?.includes("quota") || error.message?.includes("429") || error.status === 429) {
      throw new Error("API Quota Exceeded. The free tier of Gemini API has limits. \n\nTo fix this:\n1. Upgrade to a paid plan at ai.google.dev.\n2. If you just updated your key, you MUST go to Render -> Manual Deploy -> 'Clear Build Cache & Deploy' to pick up the changes.");
    }
    throw new Error("Failed to search medicine. Please try again.");
  }
}
