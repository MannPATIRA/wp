import { InsertOpportunity } from "@shared/schema";
import { storage } from "../storage";
import { openai } from "./openai";
import { googleSearch, processSearchResults, GoogleSearchResult } from "./google-search";

/**
 * Scraper Agent
 * 
 * Responsible for gathering information about educational opportunities
 * from various sources and formatting it for the system.
 */
export class ScraperAgent {
  /**
   * Search for opportunities using the provided query
   * @param query Search query
   * @param type Type of search (academic, leadership, community, research)
   * @returns List of opportunities found
   */
  async searchOpportunities(query: string, type?: string): Promise<InsertOpportunity[]> {
    try {
      // For testing and demonstration, we'll limit the scope of the search to just the first concept
      // to avoid timeouts and excessive API calls during development
      
      // Step 1: Extract extracurricular concepts from the query
      const concepts = await this.extractOpportunityConcepts(query, type);
      console.log(`Extracted ${concepts.length} concepts for search:`, concepts);
      
      // Step 2: Format a search query for the first concept only (for faster results during development)
      const searchQuery = await this.formatWebQuery(concepts[0], type);
      
      // Step 3: Find specific opportunities using Google Search
      const opportunities = await this.findSpecificOpportunities(searchQuery);
      
      // Return the opportunities
      return opportunities;
      
      /* 
      Full implementation (uncomment for production):
      
      // Step 2: For each concept, format a search query
      const searchQueries = await Promise.all(
        concepts.map(concept => this.formatWebQuery(concept, type))
      );
      
      // Step 3: For each search query, find specific opportunities using Google Search
      const opportunitySets = await Promise.all(
        searchQueries.map(query => this.findSpecificOpportunities(query))
      );
      
      // Flatten and deduplicate opportunities
      const allOpportunities = this.deduplicateOpportunities(
        opportunitySets.flat()
      );
      
      return allOpportunities;
      */
    } catch (error) {
      console.error("Error in scraper agent:", error);
      return [];
    }
  }
  
  /**
   * Extract key extracurricular concepts from the query
   */
  private async extractOpportunityConcepts(query: string, type?: string): Promise<string[]> {
    // Use OpenAI to extract concepts
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert in college admissions and extracurricular activities. Extract key extracurricular concepts from the query that would be beneficial for high school students applying to top universities.`
        },
        {
          role: "user",
          content: `From the following query, extract 3-5 specific extracurricular concepts that are beneficial for a high school student's university application. Focus on ${type || 'any extracurricular'} activities.
          
          Query: "${query}"
          
          Return a JSON array of strings, each representing a distinct extracurricular concept.`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    try {
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("Empty response from OpenAI");
        return [query]; // Fallback to original query
      }
      const result = JSON.parse(content);
      return result.concepts || [];
    } catch (error) {
      console.error("Error parsing OpenAI response for concepts:", error);
      return [query]; // Fallback to original query
    }
  }
  
  /**
   * Format a web query for finding specific opportunities
   */
  private async formatWebQuery(concept: string, type?: string): Promise<string> {
    // Use OpenAI to format an effective web query
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You're an expert at finding educational opportunities for high school students. Create specific and effective search queries.`
        },
        {
          role: "user",
          content: `Create a specific search query to find real organizations, programs, or competitions for the following extracurricular concept for high school students: "${concept}". ${type ? `The activity should be in the category of ${type}.` : ''} 
          
          The query should be optimized to find specific places, companies, and organizations offering this opportunity rather than general advice. Return just the query string without quotation marks.`
        }
      ]
    });
    
    const content = response.choices[0].message.content;
    return content ? content.trim() : `high school ${concept} programs`;
  }
  
  /**
   * Find specific opportunities based on the search query using Google Search API
   */
  private async findSpecificOpportunities(query: string): Promise<InsertOpportunity[]> {
    try {
      // Step 1: Perform Google search to get real opportunities
      console.log(`Searching for: ${query}`);
      const searchResults = await googleSearch(query, 5);
      
      if (searchResults.length === 0) {
        console.log("No search results found for query:", query);
        return [];
      }
      
      // Step 2: Process search results to get essential information
      const processedResults = processSearchResults(searchResults);
      console.log(`Found ${processedResults.length} search results`);
      
      // Step 3: Use OpenAI to extract and structure opportunity information from search results
      return await this.extractOpportunitiesFromSearchResults(processedResults, query);
    } catch (error) {
      console.error("Error finding specific opportunities:", error);
      return [];
    }
  }
  
  /**
   * Extract structured opportunities from search results using OpenAI
   */
  private async extractOpportunitiesFromSearchResults(
    searchResults: Array<{title: string, link: string, snippet: string, domain: string}>,
    originalQuery: string
  ): Promise<InsertOpportunity[]> {
    // Use OpenAI to extract structured information from the search results
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting and structuring information about real educational opportunities for high school students from web search results. Your task is to convert raw search results into properly structured opportunity objects.`
        },
        {
          role: "user",
          content: `Below are the search results for the query: "${originalQuery}"
          
          ${JSON.stringify(searchResults, null, 2)}
          
          Based on these REAL search results, create 2-3 detailed opportunity objects that represent the most relevant and high-quality opportunities for high school students. Use the actual information from the search results, including the real links.
          
          Return a JSON object with an "opportunities" array where each opportunity contains:
          - title: Name of the opportunity (use actual name from search results)
          - description: Brief description based on the search snippet
          - category: One of [Academic, Leadership, Community, Research]
          - tags: Array of relevant tags
          - applicationDeadline: Date string or null if rolling/unknown
          - programDates: Text description of when it occurs (if available from search results)
          - location: Where it takes place (if available from search results)
          - cost: Description of costs (if available from search results, otherwise "Varies")
          - eligibility: Who can apply (high school students)
          - admissionRate: Approximate acceptance rate (if available, otherwise "Not specified")
          - benefits: Array of benefits for college applications
          - requirements: Array of likely application requirements
          - impactRating: Number 1-5 indicating likely impact on college applications
          - universityImpact: Description of how it helps college applications
          - imageIcon: A material icon name that represents this opportunity
          - externalLink: The ACTUAL URL from the search result for this opportunity
          
          Focus on extracting real information from the search results, including the actual organization names and links.`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    try {
      const content = response.choices[0].message.content;
      if (!content) {
        console.error("Empty response from OpenAI for structured opportunities");
        return [];
      }
      const result = JSON.parse(content);
      return result.opportunities || [];
    } catch (error) {
      console.error("Error parsing OpenAI response for structured opportunities:", error);
      return [];
    }
  }
  
  /**
   * Remove duplicate opportunities based on title
   */
  private deduplicateOpportunities(opportunities: InsertOpportunity[]): InsertOpportunity[] {
    const uniqueOpps = new Map<string, InsertOpportunity>();
    
    for (const opp of opportunities) {
      if (!uniqueOpps.has(opp.title)) {
        uniqueOpps.set(opp.title, opp);
      }
    }
    
    return Array.from(uniqueOpps.values());
  }
}
