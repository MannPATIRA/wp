/**
 * Opportunity Validation Script
 * 
 * This script tests and validates that our recommendation engine is finding
 * real educational opportunities with working URLs rather than fake examples.
 */

import axios from 'axios';
import { searchAgent } from '../server/agents/search-agent';
import { scraperAgent } from '../server/agents/scraper';
import { processSearchResults } from '../server/agents/openai';
import { User, UserProfile } from '../shared/schema';

/**
 * Test search functionality with various queries
 */
async function testSearch(): Promise<void> {
  console.log('===== TESTING SEARCH FUNCTIONALITY =====');
  
  const testQueries = [
    'summer research programs computer science for high school students',
    'computer science competitions for high school students',
    'extracurricular activities for Imperial College London applicants',
    'prestigious programs for high school students computer science',
    'hackathons for high school students'
  ];
  
  for (const query of testQueries) {
    console.log(`\nTesting search query: "${query}"`);
    
    try {
      const searchResults = await searchAgent.searchOpportunities({
        query,
        limit: 5
      });
      
      console.log(`Found ${searchResults.length} results`);
      
      if (searchResults.length > 0) {
        console.log('Sample result:');
        console.log(`  Title: ${searchResults[0].title}`);
        console.log(`  URL: ${searchResults[0].link}`);
        console.log(`  Domain: ${searchResults[0].domain}`);
        
        // Validate that URLs are working
        for (let i = 0; i < Math.min(searchResults.length, 3); i++) {
          const url = searchResults[i].link;
          let isValid = false;
          
          try {
            // Test if URL is reachable
            const response = await axios.head(url, { 
              timeout: 5000,
              validateStatus: (status) => status < 500 // Accept any status < 500
            });
            isValid = response.status < 400; // 2xx or 3xx status codes
            console.log(`  [URL ${i+1}] ${url} - ${isValid ? 'VALID ✓' : 'INVALID ✗'} (Status: ${response.status})`);
          } catch (error) {
            console.log(`  [URL ${i+1}] ${url} - INVALID ✗ (Error: ${error.message})`);
          }
        }
      }
    } catch (error) {
      console.error(`Error testing search for "${query}":`, error.message);
    }
  }
}

/**
 * Test scraping functionality on known educational URLs
 */
async function testScraping(): Promise<void> {
  console.log('\n===== TESTING SCRAPING FUNCTIONALITY =====');
  
  const testUrls = [
    'https://www.imperial.ac.uk/be-inspired/student-recruitment-and-outreach/',
    'https://www.summerapply.com/school/imperial-college-london/global-summer-school/',
    'https://www.imperial.ac.uk/computing/prospective-students/'
  ];
  
  for (const url of testUrls) {
    console.log(`\nTesting scraping for URL: ${url}`);
    
    try {
      const scrapedData = await scraperAgent.scrapeUrl(url);
      
      if (scrapedData.title && scrapedData.description) {
        console.log('✓ Successfully scraped data:');
        console.log(`  Title: ${scrapedData.title}`);
        console.log(`  Description: ${scrapedData.description.substring(0, 100)}...`);
        console.log(`  Category: ${scrapedData.category}`);
        
        if (scrapedData.applicationDeadline) {
          console.log(`  Deadline: ${scrapedData.applicationDeadline}`);
        }
        
        if (scrapedData.benefits && scrapedData.benefits.length > 0) {
          console.log(`  Benefits: ${scrapedData.benefits.length} found`);
        }
      } else {
        console.log('✗ Failed to extract meaningful data');
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
    }
  }
}

/**
 * Test the entire recommendation pipeline for a sample user profile
 */
async function testRecommendationPipeline(): Promise<void> {
  console.log('\n===== TESTING RECOMMENDATION PIPELINE =====');
  
  // Sample user profile
  const user: User = {
    id: 999,
    username: 'testuser',
    password: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    createdAt: new Date(),
    age: null,
    grade: null
  };
  
  const profile: UserProfile = {
    id: 999,
    userId: 999,
    gpa: '4.0',
    sat: 1500,
    act: 34,
    apCourses: 5,
    targetUniversity: 'Imperial College London',
    targetMajor: 'Computer Science',
    achievements: ['National Merit Scholar'],
    extracurriculars: ['Coding Club', 'Robotics Team'],
    applicationDeadline: new Date('2025-01-15'),
    updatedAt: new Date()
  };
  
  console.log('Finding opportunities for test profile...');
  console.log(`Target University: ${profile.targetUniversity}`);
  console.log(`Target Major: ${profile.targetMajor}`);
  
  try {
    // Generate search queries
    const queries = [
      `${profile.targetMajor} opportunities for high school students applying to ${profile.targetUniversity}`,
      `summer research programs ${profile.targetMajor} for high school students`
    ];
    
    let allResults = [];
    
    // Search for opportunities
    for (const query of queries.slice(0, 2)) { // Limit to 2 queries for testing
      console.log(`\nSearching with query: "${query}"`);
      
      const results = await searchAgent.searchOpportunities({
        query,
        limit: 3
      });
      
      console.log(`Found ${results.length} search results`);
      allResults = [...allResults, ...results];
    }
    
    // Process results to extract opportunities
    console.log(`\nProcessing ${allResults.length} search results...`);
    
    const opportunities = await processSearchResults(
      allResults,
      profile.targetUniversity,
      profile.targetMajor
    );
    
    console.log(`Extracted ${opportunities.length} opportunities`);
    
    if (opportunities.length > 0) {
      console.log('\nSample opportunities:');
      
      for (let i = 0; i < Math.min(opportunities.length, 3); i++) {
        const opp = opportunities[i];
        console.log(`\nOpportunity #${i+1}:`);
        console.log(`  Title: ${opp.title}`);
        console.log(`  Category: ${opp.category}`);
        console.log(`  URL: ${opp.sourceUrl}`);
        
        // Validate that this is a real opportunity
        console.log('  Validating URL...');
        try {
          const isValid = await scraperAgent.validateOpportunityUrl(opp.sourceUrl);
          console.log(`  Validation: ${isValid ? 'PASSED ✓' : 'FAILED ✗'}`);
        } catch (error) {
          console.log('  Validation: FAILED ✗ (Error)');
        }
      }
    }
  } catch (error) {
    console.error('Error testing recommendation pipeline:', error);
  }
}

/**
 * Main test function - runs all tests
 */
async function runTests(): Promise<void> {
  try {
    console.log('=================================================');
    console.log('OPPORTUNITY VALIDATION TEST SCRIPT');
    console.log('=================================================');
    console.log('This script tests the recommendation engine to ensure');
    console.log('we are finding real educational opportunities from the web.');
    console.log('=================================================\n');
    
    // Test search functionality
    await testSearch();
    
    // Test scraping functionality
    await testScraping();
    
    // Test the complete recommendation pipeline
    await testRecommendationPipeline();
    
    console.log('\n=================================================');
    console.log('TEST SCRIPT COMPLETE');
    console.log('=================================================');
  } catch (error) {
    console.error('Test script failed:', error);
  }
}

// Run the tests
runTests();