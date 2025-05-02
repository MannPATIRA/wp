/**
 * Web Scraper for Educational Opportunities
 * 
 * This module implements web scraping functionality to extract detailed information
 * about educational opportunities from search results. It uses Puppeteer for headless
 * browsing and Cheerio for HTML parsing.
 */

import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import { SearchResult } from './search-agent';

// Timeout for fetching a page in milliseconds
const FETCH_TIMEOUT = 8000;

/**
 * Interface for scraped opportunity detail
 */
export interface ScrapedOpportunity {
  title: string;
  description: string;
  category: string;
  organization?: string;
  applicationDeadline?: string | null;
  programDates?: string | null;
  location?: string | null;
  eligibility?: string | null;
  cost?: string | null;
  benefits?: string[];
  url: string;
  isVerified: boolean;
}

/**
 * Attempt to fetch the HTML content of a URL with timeout
 */
async function fetchWithTimeout(url: string, timeout = FETCH_TIMEOUT): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

/**
 * Scrape opportunity details from a URL using Cheerio (HTML parser)
 */
export async function scrapeOpportunityWithCheerio(url: string): Promise<Partial<ScrapedOpportunity>> {
  try {
    console.log(`Scraping opportunity from ${url} with Cheerio`);
    const html = await fetchWithTimeout(url);
    const $ = cheerio.load(html);
    
    // Extract title - look for the most prominent heading
    const title = $('h1').first().text().trim() || 
                 $('h2').first().text().trim() || 
                 $('title').text().trim().split('|')[0].trim();
    
    // Extract description - look for meta description or first paragraph
    const description = $('meta[name="description"]').attr('content') || 
                        $('p').first().text().trim();
    
    // Extract other details that may be in structured data
    let applicationDeadline = null;
    let programDates = null;
    let location = null;
    let eligibility = null;
    let cost = null;
    
    // Look for common patterns in the page content
    const deadlineIndicators = ['deadline', 'due date', 'closing date', 'application close'];
    const dateIndicators = ['date', 'program date', 'starts', 'begins', 'running from'];
    const locationIndicators = ['location', 'place', 'where', 'venue', 'held at', 'takes place'];
    const eligibilityIndicators = ['eligibility', 'requirements', 'who can apply', 'applicants should'];
    const costIndicators = ['cost', 'fee', 'price', 'tuition', 'payment'];
    
    // Function to extract text after a label pattern
    const extractAfterLabel = (text: string, indicators: string[]): string | null => {
      for (const indicator of indicators) {
        const regex = new RegExp(`${indicator}[\\s:\\-]+([^.\\n]+)`, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return null;
    };
    
    // Process all paragraphs and list items
    const pageText = $('body').text();
    
    applicationDeadline = extractAfterLabel(pageText, deadlineIndicators);
    programDates = extractAfterLabel(pageText, dateIndicators);
    location = extractAfterLabel(pageText, locationIndicators);
    eligibility = extractAfterLabel(pageText, eligibilityIndicators);
    cost = extractAfterLabel(pageText, costIndicators);
    
    // Extract benefits - look for bullet points
    const benefits: string[] = [];
    $('li').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20 && text.length < 150) {
        benefits.push(text);
      }
    });
    
    // Infer category based on page content keywords
    let category = 'Academic Program';
    if (pageText.toLowerCase().includes('summer')) category = 'Summer Program';
    if (pageText.toLowerCase().includes('research')) category = 'Research';
    if (pageText.toLowerCase().includes('compet')) category = 'Competition';
    if (pageText.toLowerCase().includes('volunteer')) category = 'Volunteer';
    if (pageText.toLowerCase().includes('internship')) category = 'Internship';
    if (pageText.toLowerCase().includes('scholarship')) category = 'Scholarship';
    if (pageText.toLowerCase().includes('leader')) category = 'Leadership';
    
    return {
      title,
      description: description.substring(0, 500), // Limit description length
      category,
      applicationDeadline,
      programDates,
      location,
      eligibility,
      cost,
      benefits: benefits.slice(0, 5), // Limit to 5 benefits
      url,
      isVerified: true
    };
  } catch (error) {
    console.error(`Error scraping ${url} with Cheerio:`, error);
    return {
      url,
      isVerified: false
    };
  }
}

/**
 * Scrape opportunity details from a URL using Puppeteer (headless browser)
 * This is more powerful but also more resource intensive
 */
export async function scrapeOpportunityWithPuppeteer(url: string): Promise<Partial<ScrapedOpportunity>> {
  let browser = null;
  
  try {
    console.log(`Scraping opportunity from ${url} with Puppeteer`);
    
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set timeout for navigation
    await page.setDefaultNavigationTimeout(FETCH_TIMEOUT);
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Wait for content to load
    await page.waitForSelector('body');
    
    // Get page content
    const title = await page.$eval('h1, h2, title', el => el.textContent.trim());
    
    // Get meta description or first paragraph
    const description = await page.evaluate(() => {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && metaDesc.getAttribute('content')) {
        return metaDesc.getAttribute('content');
      }
      
      const firstPara = document.querySelector('p');
      return firstPara ? firstPara.textContent.trim() : '';
    });
    
    // Extract other details using page.evaluate
    const pageDetails = await page.evaluate(() => {
      const pageText = document.body.innerText;
      
      // Helper function to find text after a label
      const findTextAfterLabel = (text, labels) => {
        for (const label of labels) {
          const regex = new RegExp(`${label}[\\s:\\-]+([^.\\n]+)`, 'i');
          const match = text.match(regex);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return null;
      };
      
      // Extract various details
      const deadlineIndicators = ['deadline', 'due date', 'closing date', 'application close'];
      const dateIndicators = ['date', 'program date', 'starts', 'begins', 'running from'];
      const locationIndicators = ['location', 'place', 'where', 'venue', 'held at', 'takes place'];
      const eligibilityIndicators = ['eligibility', 'requirements', 'who can apply', 'applicants should'];
      const costIndicators = ['cost', 'fee', 'price', 'tuition', 'payment'];
      
      // Get benefits from bullet points
      const benefits = Array.from(document.querySelectorAll('li'))
        .map(li => li.textContent.trim())
        .filter(text => text.length > 20 && text.length < 150)
        .slice(0, 5);
      
      // Infer category based on keywords
      let category = 'Academic Program';
      const lowerPageText = pageText.toLowerCase();
      if (lowerPageText.includes('summer')) category = 'Summer Program';
      if (lowerPageText.includes('research')) category = 'Research';
      if (lowerPageText.includes('compet')) category = 'Competition';
      if (lowerPageText.includes('volunteer')) category = 'Volunteer';
      if (lowerPageText.includes('internship')) category = 'Internship';
      if (lowerPageText.includes('scholarship')) category = 'Scholarship';
      if (lowerPageText.includes('leader')) category = 'Leadership';
      
      return {
        applicationDeadline: findTextAfterLabel(pageText, deadlineIndicators),
        programDates: findTextAfterLabel(pageText, dateIndicators),
        location: findTextAfterLabel(pageText, locationIndicators),
        eligibility: findTextAfterLabel(pageText, eligibilityIndicators),
        cost: findTextAfterLabel(pageText, costIndicators),
        benefits,
        category
      };
    });
    
    return {
      title,
      description: description.substring(0, 500), // Limit description length
      category: pageDetails.category,
      applicationDeadline: pageDetails.applicationDeadline,
      programDates: pageDetails.programDates,
      location: pageDetails.location,
      eligibility: pageDetails.eligibility,
      cost: pageDetails.cost,
      benefits: pageDetails.benefits,
      url,
      isVerified: true
    };
  } catch (error) {
    console.error(`Error scraping ${url} with Puppeteer:`, error);
    return {
      url,
      isVerified: false
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape multiple search results to get detailed opportunity information
 */
export async function scrapeSearchResults(searchResults: SearchResult[]): Promise<Partial<ScrapedOpportunity>[]> {
  const opportunities: Partial<ScrapedOpportunity>[] = [];
  
  // Process results in batches to avoid overwhelming the system
  const batchSize = 3;
  
  // Deduplicate results by URL
  const uniqueUrls = new Set(searchResults.map(result => result.link));
  const urls = Array.from(uniqueUrls).slice(0, 10); // Limit to 10 results
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(urls.length/batchSize)}`);
    
    // Process each URL in the batch
    const batchPromises = batch.map(async (url) => {
      try {
        // Try with Cheerio first (faster)
        let opportunity = await scrapeOpportunityWithCheerio(url);
        
        // If Cheerio fails or returns minimal data, try with Puppeteer
        if (!opportunity.title || !opportunity.description) {
          console.log(`Retrying ${url} with Puppeteer`);
          opportunity = await scrapeOpportunityWithPuppeteer(url);
        }
        
        return opportunity;
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return { url, isVerified: false };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    opportunities.push(...batchResults.filter(opp => opp.title && opp.description));
  }
  
  return opportunities;
}

/**
 * Scraper Agent class for handling web scraping of educational opportunities
 */
export class ScraperAgent {
  /**
   * Scrape detailed information from search results
   */
  async scrapeOpportunities(searchResults: SearchResult[]): Promise<Partial<ScrapedOpportunity>[]> {
    return scrapeSearchResults(searchResults);
  }
  
  /**
   * Scrape a single URL to extract opportunity details
   */
  async scrapeUrl(url: string): Promise<Partial<ScrapedOpportunity>> {
    try {
      // Try with Cheerio first
      let opportunity = await scrapeOpportunityWithCheerio(url);
      
      // If Cheerio fails, try with Puppeteer
      if (!opportunity.title || !opportunity.description) {
        opportunity = await scrapeOpportunityWithPuppeteer(url);
      }
      
      return opportunity;
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      return { url, isVerified: false };
    }
  }
  
  /**
   * Validate if a URL is for a real educational opportunity
   */
  async validateOpportunityUrl(url: string): Promise<boolean> {
    try {
      const opportunity = await this.scrapeUrl(url);
      return !!(opportunity.title && opportunity.description && opportunity.isVerified);
    } catch (error) {
      console.error(`Error validating opportunity URL ${url}:`, error);
      return false;
    }
  }
}

export const scraperAgent = new ScraperAgent();