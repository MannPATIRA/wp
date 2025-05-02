/**
 * Search Agent
 * 
 * Provides real-world educational opportunities through the Google Custom Search API.
 * This agent searches for scholarships, internships, summer programs, and other opportunities
 * that match a student's interests and goals.
 */

import fetch from "node-fetch";

// Check for API keys
if (!process.env.GOOGLE_API_KEY) {
  console.warn("GOOGLE_API_KEY is not set. Search features will not work properly.");
}

if (!process.env.GOOGLE_SEARCH_CX) {
  console.warn("GOOGLE_SEARCH_CX is not set. Search features will not work properly.");
}

export interface SearchOptions {
  query: string;
  category?: string;
  limit?: number;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  domain: string;
}

export interface Opportunity {
  title: string;
  description: string;
  category: string;
  source: string;
  sourceUrl: string;
  deadline?: string;
  eligibility?: string[];
  tags?: string[];
}

/**
 * Handles search functionality using Google Custom Search API
 */
export class SearchAgent {
  private apiKey: string;
  private searchEngineId: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || "";
    this.searchEngineId = process.env.GOOGLE_SEARCH_CX || "";
  }

  /**
   * Search for opportunities that match the given query
   */
  async searchOpportunities(options: SearchOptions): Promise<SearchResult[]> {
    try {
      const { query, limit = 3 } = options; // Reduced limit to conserve quota
      let searchQuery = query;
      
      // Add category if provided
      if (options.category) {
        searchQuery += ` ${options.category}`;
      }
      
      // Improve search query with additional relevant parameters
      if (!searchQuery.includes('high school')) {
        searchQuery += ' high school';
      }
      
      if (!searchQuery.includes('application') && !searchQuery.includes('deadline')) {
        searchQuery += ' application';
      }
      
      // Exclude common placeholder domains
      const excludeDomains = '-site:example.org -site:example.com -site:test.com -site:demo.com';
      searchQuery += ` ${excludeDomains}`;
      
      console.log(`Executing search for query: "${searchQuery}"`);

      // Build the API URL
      const url = new URL("https://www.googleapis.com/customsearch/v1");
      url.searchParams.append("key", this.apiKey);
      url.searchParams.append("cx", this.searchEngineId);
      url.searchParams.append("q", searchQuery);
      url.searchParams.append("num", limit.toString());
      // Add date sorting to get recent results
      url.searchParams.append("sort", "date:r:1y");

      // Make the request
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Search API error:", errorText);
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (!data.items || !Array.isArray(data.items)) {
        return [];
      }
      
      // Process the results
      return data.items.map((item: any) => ({
        title: item.title || "",
        link: item.link || "",
        snippet: item.snippet || "",
        domain: this.extractDomain(item.link || "")
      }));
    } catch (error) {
      console.error("Error searching for opportunities:", error);
      throw new Error("Failed to search for opportunities");
    }
  }

  /**
   * Search for opportunities in specific categories
   */
  async searchByCategory(category: string, limit: number = 3): Promise<SearchResult[]> {
    // Enhanced search terms with more specific variations for each category
    const searchTerms: Record<string, string[]> = {
      "scholarship": [
        "scholarships for high school students",
        "merit scholarships high school",
        "financial aid high school students",
        "college application fee waivers"
      ],
      "internship": [
        "internships for high school students",
        "high school pre-college internships",
        "summer internships for high school",
        "remote internships for high school students"
      ],
      "summer-program": [
        "summer programs for high school students",
        "pre-college summer institutes",
        "summer academic programs high school",
        "residential summer programs high school"
      ],
      "research": [
        "research opportunities for high school students",
        "research internships high school",
        "science research programs high school",
        "research mentorship programs high school"
      ],
      "volunteer": [
        "volunteer opportunities for high school students",
        "community service high school students",
        "service learning projects high school",
        "nonprofit volunteering high school students"
      ],
      "competition": [
        "academic competitions for high school students",
        "national competitions high school students",
        "STEM competitions high school",
        "writing competitions high school"
      ],
      "mentorship": [
        "mentorship programs for high school students",
        "career shadowing high school",
        "professional mentors high school students",
        "industry mentorship high school"
      ],
      "law": [
        "mock trial competitions high school",
        "pre-law programs high school students",
        "youth court programs",
        "legal internships high school students",
        "debate competitions high school",
        "law firm shadowing high school",
        "youth and government programs"
      ],
      "leadership": [
        "leadership programs high school students",
        "student leadership conferences",
        "youth leadership development programs",
        "leadership workshops high school"
      ],
      "stem": [
        "STEM programs high school students",
        "science camps high school",
        "coding bootcamps high school",
        "robotics competitions high school"
      ],
      "humanities": [
        "humanities programs high school",
        "philosophy competitions high school",
        "history research programs",
        "literary analysis competitions"
      ],
      "arts": [
        "arts programs high school",
        "visual arts competitions high school",
        "performing arts opportunities high school",
        "creative writing programs high school"
      ],
      "business": [
        "business programs high school",
        "entrepreneurship competitions high school",
        "financial literacy programs high school",
        "business case competitions"
      ],
      "healthcare": [
        "healthcare programs high school",
        "pre-med opportunities high school",
        "hospital volunteer programs high school",
        "healthcare shadowing high school"
      ]
    };
    
    // Try to find specific search terms for the category
    let queries = searchTerms[category.toLowerCase()];
    
    // If no specific queries found, create a generic one
    if (!queries) {
      queries = [`${category} opportunities for high school students`];
    }
    
    // We'll combine the results from multiple queries
    let allResults: SearchResult[] = [];
    
    // Use just the first 2 queries to conserve API quota
    for (let i = 0; i < Math.min(2, queries.length); i++) {
      try {
        const results = await this.searchOpportunities({
          query: queries[i],
          limit
        });
        
        // Add to combined results
        allResults = [...allResults, ...results];
      } catch (error) {
        console.error(`Error searching for query "${queries[i]}":`, error);
        // Continue with next query if one fails
      }
    }
    
    // Deduplicate by URL
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.link === result.link)
    );
    
    return uniqueResults;
  }

  /**
   * Extract domain name from a URL
   */
  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.startsWith('www.') ? domain.substring(4) : domain;
    } catch (error) {
      return "";
    }
  }
}

export const searchAgent = new SearchAgent();