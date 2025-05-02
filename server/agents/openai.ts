import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check for API key
if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. AI features will not work properly.");
}

export interface WebSearchParams {
  targetUniversity: string | null;
  targetMajor: string | null;
  userInterests?: string[];
  specificTopic?: string;
}

/**
 * Generate a web search query for finding opportunities for a specific university and major
 */
export async function generateSearchQuery(params: WebSearchParams): Promise<string> {
  try {
    const { targetUniversity, targetMajor, userInterests, specificTopic } = params;
    
    const interests = userInterests?.join(", ") || "";
    
    const prompt = `
    Generate a specific web search query to find educational opportunities, extracurricular activities, or programs 
    that would be valuable for a high school student applying to ${targetUniversity || 'top universities'} 
    for ${targetMajor || 'competitive majors'}.
    
    ${interests ? `The student is interested in: ${interests}` : ''}
    ${specificTopic ? `Focus on opportunities related to: ${specificTopic}` : ''}
    
    The query should be specific enough to return actual programs, competitions, summer camps, research opportunities,
    or other concrete activities that would strengthen a college application, not general advice articles.
    
    Your response should be ONLY the search query text, nothing else. No explanations or additional text.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates effective search queries." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 100
    });
    
    const query = response.choices[0].message.content?.trim() || 
      `${params.targetUniversity || 'top university'} ${params.targetMajor || ''} opportunities for high school students`;
    
    return query;
  } catch (error) {
    console.error("Error generating search query:", error);
    return `${params.targetUniversity || 'university'} ${params.targetMajor || ''} opportunities for high school students`;
  }
}

/**
 * Process search results to extract the most relevant opportunities
 */
export async function analyzeCategoryForOpportunities(category: string, targetUniversity: string | null, targetMajor: string | null): Promise<string[]> {
  try {
    const prompt = `
    What are the top 3-5 specific opportunities in the category of "${category}" that would be valuable for a high school student 
    applying to ${targetUniversity || 'top universities'} for ${targetMajor || 'competitive majors'}?
    
    For each opportunity, provide a specific concept or activity name that could be searched for online to find actual programs.
    For example, instead of just "research program", suggest specific research programs like "Research Science Institute (RSI)" 
    or "Summer Science Program (SSP)".
    
    Return your response as a list of strings, with each item being a specific opportunity name that can be directly searched for.
    Format your response as a JSON array of strings.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a college admissions expert who knows the specific extracurricular opportunities that top universities value."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      return [`${category} opportunities for high school students`];
    }
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Handle different possible response formats
      if (Array.isArray(parsedContent)) {
        return parsedContent;
      } else if (parsedContent.opportunities && Array.isArray(parsedContent.opportunities)) {
        return parsedContent.opportunities;
      } else if (parsedContent.items && Array.isArray(parsedContent.items)) {
        return parsedContent.items;
      } else if (parsedContent.results && Array.isArray(parsedContent.results)) {
        return parsedContent.results;
      } else if (parsedContent.names && Array.isArray(parsedContent.names)) {
        return parsedContent.names;
      } else {
        // Try to extract any array property from the response
        const arrayProps = Object.entries(parsedContent)
          .find(([_, value]) => Array.isArray(value));
        
        if (arrayProps) {
          return arrayProps[1];
        }
      }
      
      // Fallback if no array found
      console.warn("No opportunity array found in response:", parsedContent);
      return [`${category} opportunities for high school students`];
    } catch (error) {
      console.error("Error parsing category analysis response:", error);
      return [`${category} opportunities for high school students`];
    }
  } catch (error) {
    console.error("Error analyzing category for opportunities:", error);
    return [`${category} opportunities for high school students`];
  }
}

/**
 * Process search results to extract and structure opportunities
 */
export async function processSearchResults(results: any[], targetUniversity: string | null, targetMajor: string | null): Promise<any[]> {
  if (!results || results.length === 0) {
    return [];
  }
  
  try {
    // Format the search results for the prompt
    const formattedResults = results.map((result, index) => {
      return `Result ${index + 1}:
Title: ${result.title}
URL: ${result.link}
Description: ${result.snippet}`;
    }).join("\n\n");
    
    const prompt = `
    Analyze these search results about educational opportunities for high school students interested in ${targetMajor || 'computer science'} 
    applying to ${targetUniversity || 'top universities'}.
    
    ${formattedResults}
    
    Extract as many REAL educational opportunities as possible from these results. For each opportunity:
    
    1. Title of the opportunity (use the exact name from the website, NOT a generic description)
    2. Brief description (2-3 sentences maximum)
    3. Category (one of: Research, Competition, Summer Program, Internship, Volunteer, Leadership, Scholarship, Academic Program, Hackathon, Coding Bootcamp, Workshop)
    4. Why it would be valuable for college applications (1 sentence)
    5. URL (the exact URL from the search result)
    
    Format as a JSON array of opportunity objects with properties: title, description, category, value, sourceUrl
    
    VERY IMPORTANT:
    - Extract ALL SPECIFIC opportunities from the results, even if you need to look closely at list articles
    - Be comprehensive and thorough - identify MULTIPLE opportunities where possible
    - For Computer Science specifically, find opportunities like: coding competitions, hackathons, research programs, summer coding bootcamps, game development workshops, etc.
    - ONLY include real, existing opportunities with specific names and websites
    - Do NOT create or invent generic opportunities 
    - If a result is a list article (like "Top 10 CS Opportunities"), extract each specific named opportunity mentioned
    - NEVER return example/fake opportunities with URLs like "example.org" or "example.com"
    - ALWAYS use the actual URLs from the search results
    - AIM TO FIND AT LEAST 5-10 DISTINCT OPPORTUNITIES if they exist in the data
    
    TARGET UNIVERSITY: ${targetUniversity || 'prestigious universities'}
    TARGET MAJOR: ${targetMajor || 'computer science'}
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are a specialized educational advisor for computer science and technology students who excels at identifying relevant CS/technology opportunities from search results. Your expertise is in finding real, specific educational opportunities that will strengthen a student's college application, particularly for computer science and technology-related majors. You are extremely thorough and extract multiple distinct opportunities from search results, especially from list articles."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }
    
    try {
      const parsedContent = JSON.parse(content);
      console.log("Search results parsed content:", parsedContent);
      
      // Handle different possible response formats
      if (Array.isArray(parsedContent)) {
        return parsedContent;
      } else if (parsedContent.opportunities && Array.isArray(parsedContent.opportunities)) {
        return parsedContent.opportunities;
      } else if (parsedContent.items && Array.isArray(parsedContent.items)) {
        return parsedContent.items;
      } else if (parsedContent.results && Array.isArray(parsedContent.results)) {
        return parsedContent.results;
      } else {
        // Try to extract any array property from the response
        const arrayProps = Object.entries(parsedContent)
          .find(([_, value]) => Array.isArray(value));
        
        if (arrayProps) {
          return arrayProps[1];
        }
      }
      
      console.warn("No opportunity array found in search results response:", parsedContent);
      return [];
    } catch (error) {
      console.error("Error parsing search results:", error);
      return [];
    }
  } catch (error) {
    console.error("Error processing search results:", error);
    return [];
  }
}