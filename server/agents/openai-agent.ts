import OpenAI from "openai";
import { UserProfile } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Check for API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. AI features will not work properly.");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RecommendationRequest {
  userProfile: UserProfile;
  specificFocus?: string;
}

export interface Recommendation {
  title: string;
  description: string;
  actionItems: string[];
  reasoning: string;
  timeframe: string;
  priority: "high" | "medium" | "low";
}

export interface UniversityCompatibility {
  universityName: string;
  compatibility: number; // 0-100
  strengths: string[];
  areasToImprove: string[];
  recommendedActions: string[];
}

export interface ProfileFeedback {
  overallAssessment: string;
  academicStrengths: string[];
  academicWeaknesses: string[];
  extracurricularStrengths: string[];
  extracurricularWeaknesses: string[];
  recommendedImprovements: string[];
}

/**
 * OpenAI Agent
 * 
 * Provides AI-powered recommendations and analysis for student profiles
 */
export class OpenAIAgent {
  /**
   * Generate personalized recommendations for a student
   */
  async getRecommendations(request: RecommendationRequest): Promise<Recommendation[]> {
    try {
      const prompt = this.buildRecommendationPrompt(request);
      
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert college admissions consultant who provides personalized recommendations to high school students preparing for university applications. Provide detailed, actionable recommendations based on their profile."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content returned from OpenAI");
      }

      const parsedContent = JSON.parse(content);
      return parsedContent.recommendations || [];
      
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw new Error("Failed to generate recommendations");
    }
  }

  /**
   * Analyze a student's compatibility with specific universities
   */
  async analyzeUniversityCompatibility(
    userProfile: UserProfile, 
    universityNames: string[]
  ): Promise<UniversityCompatibility[]> {
    try {
      const prompt = this.buildUniversityCompatibilityPrompt(userProfile, universityNames);
      
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert college admissions consultant who analyzes student profiles for compatibility with specific universities. Provide detailed analysis and actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content returned from OpenAI");
      }

      const parsedContent = JSON.parse(content);
      return parsedContent.universityCompatibility || [];
      
    } catch (error) {
      console.error("Error analyzing university compatibility:", error);
      throw new Error("Failed to analyze university compatibility");
    }
  }

  /**
   * Provide feedback on a student's academic profile
   */
  async getProfileFeedback(userProfile: UserProfile): Promise<ProfileFeedback> {
    try {
      const prompt = this.buildProfileFeedbackPrompt(userProfile);
      
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert college admissions consultant who provides constructive feedback on student profiles. Focus on identifying strengths, weaknesses, and areas for improvement."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content returned from OpenAI");
      }

      const parsedContent = JSON.parse(content);
      return parsedContent.profileFeedback || {};
      
    } catch (error) {
      console.error("Error generating profile feedback:", error);
      throw new Error("Failed to generate profile feedback");
    }
  }

  private buildRecommendationPrompt(request: RecommendationRequest): string {
    const { userProfile, specificFocus } = request;
    
    // Build profile details for the prompt
    const gpa = userProfile.gpa || "Not specified";
    const sat = userProfile.sat || "Not specified";
    const act = userProfile.act || "Not specified";
    const apCourses = userProfile.apCourses || "Not specified";
    const targetUniversity = userProfile.targetUniversity || "Not specified";
    const targetMajor = userProfile.targetMajor || "Not specified";
    const achievements = userProfile.achievements?.join(", ") || "Not specified";
    const extracurriculars = userProfile.extracurriculars?.join(", ") || "Not specified";
    
    // Format prompt
    const prompt = `
Please provide 3-5 personalized recommendations for a high school student with the following profile:

GPA: ${gpa}
SAT: ${sat}
ACT: ${act}
AP Courses: ${apCourses}
Target University: ${targetUniversity}
Target Major: ${targetMajor}
Achievements: ${achievements}
Extracurricular Activities: ${extracurriculars}

${specificFocus ? `Please focus specifically on: ${specificFocus}` : ''}

Output should be JSON in this format:
{
  "recommendations": [
    {
      "title": "Short title of the recommendation",
      "description": "Detailed explanation of what to do",
      "actionItems": ["Specific step 1", "Specific step 2", "Specific step 3"],
      "reasoning": "Why this recommendation is important for college admissions",
      "timeframe": "When to complete this (e.g., 'Summer before senior year')",
      "priority": "high|medium|low"
    }
  ]
}

The recommendations should be specific, actionable, and tailored to help this student improve their chances of admission.
`;

    return prompt;
  }

  private buildUniversityCompatibilityPrompt(userProfile: UserProfile, universityNames: string[]): string {
    // Build profile details for the prompt
    const gpa = userProfile.gpa || "Not specified";
    const sat = userProfile.sat || "Not specified";
    const act = userProfile.act || "Not specified";
    const apCourses = userProfile.apCourses || "Not specified";
    const targetMajor = userProfile.targetMajor || "Not specified";
    const achievements = userProfile.achievements?.join(", ") || "Not specified";
    const extracurriculars = userProfile.extracurriculars?.join(", ") || "Not specified";
    
    // Format the list of universities
    const universitiesList = universityNames.join(", ");
    
    // Format prompt
    const prompt = `
Please analyze this student's compatibility with the following universities: ${universitiesList}.

Student profile:
GPA: ${gpa}
SAT: ${sat}
ACT: ${act}
AP Courses: ${apCourses}
Intended Major: ${targetMajor}
Achievements: ${achievements}
Extracurricular Activities: ${extracurriculars}

For each university, provide:
1. A compatibility score (0-100)
2. The student's strengths relative to this university
3. Areas where the student needs to improve
4. Specific actions the student can take to increase their chances of admission

Output should be JSON in this format:
{
  "universityCompatibility": [
    {
      "universityName": "University Name",
      "compatibility": 85,
      "strengths": ["Strong academic record", "Relevant extracurriculars"],
      "areasToImprove": ["Needs more community service", "SAT score below average for this school"],
      "recommendedActions": ["Take SAT again and aim for X score", "Join a community service club"]
    }
  ]
}

Base your analysis on the actual admissions criteria, academic rigor, and typical student profile for each university.
`;

    return prompt;
  }

  private buildProfileFeedbackPrompt(userProfile: UserProfile): string {
    // Build profile details for the prompt
    const gpa = userProfile.gpa || "Not specified";
    const sat = userProfile.sat || "Not specified";
    const act = userProfile.act || "Not specified";
    const apCourses = userProfile.apCourses || "Not specified";
    const targetUniversity = userProfile.targetUniversity || "Not specified";
    const targetMajor = userProfile.targetMajor || "Not specified";
    const achievements = userProfile.achievements?.join(", ") || "Not specified";
    const extracurriculars = userProfile.extracurriculars?.join(", ") || "Not specified";
    
    // Format prompt
    const prompt = `
Please provide constructive feedback on this student's academic profile:

GPA: ${gpa}
SAT: ${sat}
ACT: ${act}
AP Courses: ${apCourses}
Target University: ${targetUniversity}
Target Major: ${targetMajor}
Achievements: ${achievements}
Extracurricular Activities: ${extracurriculars}

Analyze the profile's strengths and weaknesses for college applications, especially if the student is aiming for ${targetUniversity} and majoring in ${targetMajor}.

Output should be JSON in this format:
{
  "profileFeedback": {
    "overallAssessment": "Overall assessment of the student's profile",
    "academicStrengths": ["Strength 1", "Strength 2"],
    "academicWeaknesses": ["Weakness 1", "Weakness 2"],
    "extracurricularStrengths": ["Strength 1", "Strength 2"],
    "extracurricularWeaknesses": ["Weakness 1", "Weakness 2"],
    "recommendedImprovements": ["Improvement 1", "Improvement 2", "Improvement 3"]
  }
}

Be honest but constructive, focusing on what the student can actually improve before university applications.
`;

    return prompt;
  }
}

export const openAIAgent = new OpenAIAgent();