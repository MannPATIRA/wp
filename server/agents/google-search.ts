/**
 * Google Search API Module
 * 
 * This module provides functionality to search the web using Google Custom Search API.
 * It requires the following environment variables:
 * - GOOGLE_API_KEY: Your Google API key with the Custom Search API enabled
 * - GOOGLE_SEARCH_CX: Your Custom Search Engine ID
 */

/**
 * Interface representing a search result item from Google Custom Search
 */
export interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    metatags?: Array<{
      [key: string]: string;
    }>;
    cse_thumbnail?: Array<{
      src: string;
      width: string;
      height: string;
    }>;
  };
}

/**
 * Interface representing the entire search result response from Google Custom Search
 */
export interface GoogleSearchResponse {
  items?: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Search the web using Google Custom Search API
 * @param query The search query
 * @param num Optional number of results to return (default: 5, max: 10)
 * @returns An array of search result items or empty array if error
 */
export async function googleSearch(query: string, num: number = 5): Promise<GoogleSearchResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_CX;
  
  if (!apiKey || !searchEngineId) {
    console.error("Google Search API key or Search Engine ID not configured");
    return [];
  }
  
  try {
    // URL encode the query
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://customsearch.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodedQuery}&num=${Math.min(num, 10)}`;
    
    console.log(`Making Google Search API request to: ${searchUrl.replace(apiKey, "REDACTED")}`);
    
    const response = await fetch(searchUrl);
    console.log(`Google Search API response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Search API error:", JSON.stringify(errorData, null, 2));
      return [];
    }
    
    const data: GoogleSearchResponse = await response.json();
    
    if (data.error) {
      console.error("Google Search API returned an error:", JSON.stringify(data.error, null, 2));
      return [];
    }
    
    console.log(`Google Search API found ${data.items?.length || 0} results for "${query}"`);
    console.log(`Search information:`, data.searchInformation);
    
    return data.items || [];
  } catch (error) {
    console.error("Error performing Google search:", error);
    return [];
  }
}

/**
 * Extract domain name from a URL
 * @param url The URL to extract domain from
 * @returns The domain name
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return url;
  }
}

/**
 * Process search results to extract the most useful information
 * @param results The search results from Google API
 * @returns Processed search results with essential information
 */
export function processSearchResults(results: GoogleSearchResult[]): Array<{title: string, link: string, snippet: string, domain: string}> {
  return results.map(result => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet,
    domain: extractDomain(result.link)
  }));
}