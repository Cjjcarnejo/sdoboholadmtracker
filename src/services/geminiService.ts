import { GoogleGenAI, Type } from "@google/genai";
import { Grade, ReasonForADM, AcademicStatus, Assessment } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface RecommendationInput {
  studentName: string;
  grade: Grade;
  reasonForADM: ReasonForADM;
  academicStatus: AcademicStatus;
}

export interface RecommendationOutput {
  recommendation: Assessment;
  justification: string;
}

export async function getADMAssessmentRecommendation(input: RecommendationInput): Promise<RecommendationOutput | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Assess the following student enrolled in Alternative Delivery Mode (ADM) and recommend if they should continue ADM or return to regular classes.
      
      Student Name: ${input.studentName}
      Grade Level: ${input.grade}
      Reason for ADM: ${input.reasonForADM}
      Current Academic Status: ${input.academicStatus}
      
      Consider the reasons and their academic performance. If performance is Outstanding or Very Satisfactory and the reason (like Distance or Health) is manageable, they might return. If reasons like Work or Family Problems persist and performance is Satisfactory or lower, they might need to continue ADM.`,
      config: {
        systemInstruction: "You are an expert education consultant specialized in Alternative Delivery Mode (ADM). Provide a professional assessment and recommendation.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: {
              type: Type.STRING,
              description: "The assessment recommendation: 'Continue ADM' or 'Back to Regular Class'.",
              enum: ['Continue ADM', 'Back to Regular Class']
            },
            justification: {
              type: Type.STRING,
              description: "A brief professional justification for the recommendation."
            }
          },
          required: ["recommendation", "justification"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    return null;
  } catch (error) {
    console.error("Gemini AI Recommendation error:", error);
    return null;
  }
}
