/**
 * Opportunity Verification Script
 * 
 * This script checks the database for all stored opportunities and verifies
 * that they are real by checking their URLs and ensuring they are not example.org
 * or other placeholder domains.
 * 
 * Can be run daily via a cron job to maintain recommendation quality.
 */

const axios = require('axios');
const { storage } = require('../server/storage');

/**
 * Verify if a URL is valid and accessible
 */
async function verifyUrl(url) {
  if (!url) return false;
  
  // Check if the URL is a placeholder
  if (url.includes('example.org') || 
      url.includes('example.com') || 
      url.includes('placeholder') ||
      url.includes('testsite')) {
    return false;
  }
  
  try {
    // Check if the URL is accessible
    const response = await axios.head(url, {
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept any status < 500
    });
    
    return response.status < 400; // 2xx or 3xx status codes
  } catch (error) {
    console.error(`Error verifying URL ${url}:`, error.message);
    return false;
  }
}

/**
 * Verify all opportunities in the database
 */
async function verifyAllOpportunities() {
  try {
    console.log('Retrieving all opportunities from the database...');
    const opportunities = await storage.getOpportunities();
    
    console.log(`Found ${opportunities.length} opportunities in the database`);
    
    let validCount = 0;
    let invalidCount = 0;
    const invalidOpportunities = [];
    
    // Check each opportunity
    for (const opportunity of opportunities) {
      const { id, title, externalLink } = opportunity;
      
      console.log(`[${id}] Verifying "${title}"`);
      const isValid = await verifyUrl(externalLink);
      
      if (isValid) {
        console.log(`✓ Valid: ${externalLink}`);
        validCount++;
      } else {
        console.log(`✗ Invalid: ${externalLink}`);
        invalidCount++;
        invalidOpportunities.push({ id, title, externalLink });
      }
    }
    
    // Output summary
    console.log('\n===== VERIFICATION SUMMARY =====');
    console.log(`Total opportunities: ${opportunities.length}`);
    console.log(`Valid: ${validCount} (${(validCount / opportunities.length * 100).toFixed(1)}%)`);
    console.log(`Invalid: ${invalidCount} (${(invalidCount / opportunities.length * 100).toFixed(1)}%)`);
    
    if (invalidCount > 0) {
      console.log('\nInvalid opportunities:');
      invalidOpportunities.forEach(({ id, title, externalLink }) => {
        console.log(`- [${id}] "${title}" (${externalLink || 'no URL'})`);
      });
      
      // Here you could implement code to remove invalid opportunities
      // or mark them for review
    }
    
    return {
      total: opportunities.length,
      valid: validCount,
      invalid: invalidCount,
      invalidList: invalidOpportunities
    };
  } catch (error) {
    console.error('Error verifying opportunities:', error);
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      invalidList: []
    };
  }
}

// Run the verification if the script is executed directly
if (require.main === module) {
  verifyAllOpportunities()
    .then(() => {
      console.log('Verification complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  verifyUrl,
  verifyAllOpportunities
};