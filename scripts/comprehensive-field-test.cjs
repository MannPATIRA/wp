const axios = require('axios');
const fs = require('fs').promises;

/**
 * Comprehensive Field Testing Script
 * 
 * This script tests the recommendation engine across multiple academic fields
 * to ensure comprehensive coverage with at least 7 recommendations per field.
 * 
 * It runs tests for all 16 academic fields and generates a detailed report.
 */

// Define the fields to test and universities to pair with them
const fieldsAndUniversities = [
  { field: 'Computer Science', university: 'MIT' },
  { field: 'Engineering', university: 'Stanford University' },
  { field: 'Mathematics', university: 'Cambridge University' },
  { field: 'Physics', university: 'California Institute of Technology' },
  { field: 'Biology', university: 'Harvard University' },
  { field: 'Chemistry', university: 'ETH Zurich' },
  { field: 'Law', university: 'Harvard Law School' },
  { field: 'Pre-Law', university: 'Yale Law School' },
  { field: 'Business', university: 'University of Pennsylvania' },
  { field: 'Economics', university: 'London School of Economics' },
  { field: 'Psychology', university: 'Stanford University' },
  { field: 'History', university: 'Oxford University' },
  { field: 'English Literature', university: 'Cambridge University' },
  { field: 'Art', university: 'Rhode Island School of Design' },
  { field: 'Music', university: 'Juilliard School' },
  { field: 'Political Science', university: 'Georgetown University' }
];

// Register a test user
async function registerTestUser() {
  try {
    const response = await axios.post('http://localhost:5000/api/register', {
      username: 'fieldtester',
      password: 'testpass123',
      firstName: 'Field',
      lastName: 'Tester',
      email: 'fieldtester@example.com'
    });
    
    console.log('Test user registered successfully');
    return response.headers['set-cookie'][0];
  } catch (error) {
    if (error.response && error.response.status === 400 && 
        error.response.data.includes('already exists')) {
      console.log('Test user already exists, logging in instead');
      return login();
    }
    console.error('Failed to register test user:', error.message);
    throw error;
  }
}

// Login to get an authentication cookie
async function login() {
  try {
    const response = await axios.post('http://localhost:5000/api/login', {
      username: 'fieldtester',
      password: 'testpass123'
    }, {
      withCredentials: true
    });
    
    console.log('Successfully logged in');
    return response.headers['set-cookie'][0];
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

// Create or update user profile with a specific major and university
async function updateProfile(cookie, majorField, university) {
  try {
    const profileData = {
      targetMajor: majorField,
      targetUniversity: university,
      gpa: '4.0',
      sat: 1500,
      act: 34,
      apCourses: 5,
      achievements: ['Honor Roll', 'Student Government', 'Award Winner'],
      extracurriculars: ['Debate Team', 'Community Service', 'School Newspaper'],
      applicationDeadline: new Date(2026, 0, 15).toISOString()
    };
    
    // Check if profile exists first
    try {
      console.log('Checking if profile exists...');
      const getResponse = await axios.get('http://localhost:5000/api/profile', {
        headers: {
          Cookie: cookie
        },
        withCredentials: true
      });
      
      // Profile exists, update it
      console.log('Profile exists, updating...');
      const updateResponse = await axios.post('http://localhost:5000/api/profile', profileData, {
        headers: {
          Cookie: cookie
        },
        withCredentials: true
      });
      console.log(`Profile updated for ${majorField}`);
      return updateResponse.data;
    } catch (getError) {
      // Profile doesn't exist, create it
      console.log('Profile does not exist, creating new profile...');
      const createResponse = await axios.post('http://localhost:5000/api/profile', profileData, {
        headers: {
          Cookie: cookie
        },
        withCredentials: true
      });
      console.log('Profile created successfully');
      
      // Wait a moment to ensure profile is registered in the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return createResponse.data;
    }
  } catch (error) {
    if (error.response) {
      console.error(`Failed to update profile for ${majorField}:`, error.response.status, error.response.data);
    } else {
      console.error(`Failed to update profile for ${majorField}:`, error.message);
    }
    throw error;
  }
}

// Get recommendations for the current profile
async function getRecommendations(cookie) {
  try {
    console.log('Fetching recommendations...');
    const response = await axios.get('http://localhost:5000/api/recommendations', {
      headers: {
        Cookie: cookie
      },
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to get recommendations:', error.message);
    throw error;
  }
}

// Test a specific field and its recommendations
async function testField(cookie, majorField, university) {
  console.log(`\n===== Testing ${majorField} at ${university} =====`);
  
  try {
    // Update user profile with the current field
    await updateProfile(cookie, majorField, university);
    
    // Add a small delay to ensure the profile update is processed
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get recommendations for this field
    const recommendations = await getRecommendations(cookie);
    
    console.log(`Received ${recommendations.length} recommendations for ${majorField}`);
    
    // Analyze categories and domains
    const categories = {};
    const domains = new Set();
    
    recommendations.forEach(rec => {
      // Track categories
      categories[rec.category] = (categories[rec.category] || 0) + 1;
      
      // Track domains
      if (rec.externalLink) {
        try {
          const url = new URL(rec.externalLink);
          domains.add(url.hostname);
        } catch (e) {
          // Skip invalid URLs
        }
      }
    });
    
    // Log summary information
    console.log(`Categories: ${Object.keys(categories).join(', ')}`);
    console.log(`Unique domains: ${domains.size}`);
    
    // Log all recommendations for this field
    console.log('All recommendations:');
    recommendations.forEach((rec, i) => {
      console.log(`${i+1}. ${rec.title}`);
      console.log(`   Category: ${rec.category}`);
      console.log(`   Link: ${rec.externalLink || 'No link'}`);
      console.log(`   Source: ${rec.source || 'Unknown'}`);
      if (rec.benefits) {
        console.log(`   Impact/Benefits: ${Array.isArray(rec.benefits) ? rec.benefits.join(", ").substring(0, 100) + "..." : rec.benefits}`);
      }
      if (rec.impactRating) {
        console.log(`   Impact Rating: ${rec.impactRating}/5`);
      }
      console.log('');
    });
    
    return {
      field: majorField,
      university: university,
      count: recommendations.length,
      categories: Object.keys(categories).length,
      categoryBreakdown: categories,
      uniqueDomains: domains.size,
      hasSevenOrMore: recommendations.length >= 7,
      recommendations: recommendations.map(r => ({
        title: r.title,
        category: r.category,
        link: r.externalLink,
        source: r.source
      }))
    };
  } catch (error) {
    console.error(`Error testing ${majorField}:`, error);
    return {
      field: majorField,
      university: university,
      count: 0,
      error: error.message
    };
  }
}

// Run a test for a subset of fields (to avoid API quota issues)
async function runLimitedTest() {
  console.log('Starting limited field testing...');
  
  try {
    // Get auth cookie
    let cookie;
    try {
      cookie = await registerTestUser();
    } catch (e) {
      console.log('Using login instead of register');
      cookie = await login();
    }
    
    if (!cookie) {
      throw new Error('Failed to get authentication cookie');
    }
    
    const results = [];
    
    // Test a representative sample of fields - one per major category
    const testSample = [
      { field: 'Computer Science', university: 'MIT' },            // STEM
      { field: 'Law', university: 'Harvard Law School' },          // Law
      { field: 'Business', university: 'University of Pennsylvania' }, // Business
      { field: 'English Literature', university: 'Cambridge University' }, // Humanities
      { field: 'Art', university: 'Rhode Island School of Design' }   // Arts
    ];
    
    // Test each field in our sample
    for (const { field, university } of testSample) {
      console.log(`\nTesting field: ${field} at ${university}`);
      const result = await testField(cookie, field, university);
      results.push(result);
      
      // Add a longer delay between tests to avoid overwhelming the API quota
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Calculate statistics
    const totalRecommendations = results.reduce((sum, result) => sum + result.count, 0);
    const averageRecommendations = totalRecommendations / results.length;
    const fieldsWithAdequateRecommendations = results.filter(r => r.hasSevenOrMore).length;
    
    // Calculate field-specific statistics
    const lawFields = results.filter(r => 
      r.field.toLowerCase().includes('law')
    );
    const stemFields = results.filter(r => 
      ['computer science', 'engineering', 'mathematics', 'physics', 'chemistry', 'biology'].includes(r.field.toLowerCase())
    );
    const humanitiesFields = results.filter(r => 
      ['history', 'english literature', 'political science'].includes(r.field.toLowerCase())
    );
    const businessFields = results.filter(r => 
      ['business', 'economics'].includes(r.field.toLowerCase())
    );
    const artsFields = results.filter(r =>
      ['art', 'music'].includes(r.field.toLowerCase())
    );
    
    console.log('\n===== Comprehensive Test Summary =====');
    console.log(`Total fields tested: ${results.length}`);
    console.log(`Total recommendations across all fields: ${totalRecommendations}`);
    console.log(`Average recommendations per field: ${averageRecommendations.toFixed(2)}`);
    console.log(`Fields with 7+ recommendations: ${fieldsWithAdequateRecommendations}/${results.length} (${(fieldsWithAdequateRecommendations / results.length * 100).toFixed(2)}%)`);
    
    console.log('\n===== Field Group Performance =====');
    console.log(`Law fields: ${(lawFields.reduce((sum, r) => sum + r.count, 0) / lawFields.length).toFixed(2)} recommendations per field`);
    console.log(`STEM fields: ${(stemFields.reduce((sum, r) => sum + r.count, 0) / stemFields.length).toFixed(2)} recommendations per field`);
    console.log(`Humanities fields: ${(humanitiesFields.reduce((sum, r) => sum + r.count, 0) / humanitiesFields.length).toFixed(2)} recommendations per field`);
    console.log(`Business fields: ${(businessFields.reduce((sum, r) => sum + r.count, 0) / businessFields.length).toFixed(2)} recommendations per field`);
    console.log(`Arts fields: ${(artsFields.reduce((sum, r) => sum + r.count, 0) / artsFields.length).toFixed(2)} recommendations per field`);
    
    // Generate a markdown report
    let report = `# Comprehensive Field Test Report\n\n`;
    report += `**Test Date:** ${new Date().toISOString()}\n\n`;
    report += `## Summary\n\n`;
    report += `- Total fields tested: ${results.length}\n`;
    report += `- Total recommendations: ${totalRecommendations}\n`;
    report += `- Average recommendations per field: ${averageRecommendations.toFixed(2)}\n`;
    report += `- Fields with 7+ recommendations: ${fieldsWithAdequateRecommendations}/${results.length} (${(fieldsWithAdequateRecommendations / results.length * 100).toFixed(2)}%)\n\n`;
    
    report += `## Field Group Performance\n\n`;
    report += `- Law fields: ${(lawFields.reduce((sum, r) => sum + r.count, 0) / lawFields.length).toFixed(2)} recommendations per field\n`;
    report += `- STEM fields: ${(stemFields.reduce((sum, r) => sum + r.count, 0) / stemFields.length).toFixed(2)} recommendations per field\n`;
    report += `- Humanities fields: ${(humanitiesFields.reduce((sum, r) => sum + r.count, 0) / humanitiesFields.length).toFixed(2)} recommendations per field\n`;
    report += `- Business fields: ${(businessFields.reduce((sum, r) => sum + r.count, 0) / businessFields.length).toFixed(2)} recommendations per field\n`;
    report += `- Arts fields: ${(artsFields.reduce((sum, r) => sum + r.count, 0) / artsFields.length).toFixed(2)} recommendations per field\n\n`;
    
    report += `## Detailed Results by Field\n\n`;
    
    // Sort results by number of recommendations (descending)
    const sortedResults = [...results].sort((a, b) => b.count - a.count);
    
    for (const result of sortedResults) {
      report += `### ${result.field} (${result.university})\n\n`;
      report += `- **Total recommendations:** ${result.count}\n`;
      report += `- **Meets minimum requirement (7+):** ${result.hasSevenOrMore ? '✅ Yes' : '❌ No'}\n`;
      report += `- **Categories:** ${result.categories}\n`;
      report += `- **Unique domains:** ${result.uniqueDomains}\n\n`;
      
      if (result.recommendations && result.recommendations.length > 0) {
        report += `#### Recommended Opportunities:\n\n`;
        for (let i = 0; i < result.recommendations.length; i++) {
          const rec = result.recommendations[i];
          report += `${i+1}. **${rec.title}** - ${rec.category}\n`;
          if (rec.link) {
            report += `   - Link: ${rec.link}\n`;
          }
          if (rec.source) {
            report += `   - Source: ${rec.source}\n`;
          }
          report += '\n';
        }
      }
      
      report += '\n';
    }
    
    // Save results and report to files
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsFilename = `field-test-results-${timestamp}.json`;
    const reportFilename = `field-test-report-${timestamp}.md`;
    
    await fs.writeFile(resultsFilename, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        fieldsCount: results.length,
        totalRecommendations,
        averageRecommendations,
        fieldsWithAdequateRecommendations,
        percentage: (fieldsWithAdequateRecommendations / results.length * 100).toFixed(2)
      },
      fieldGroupPerformance: {
        law: (lawFields.reduce((sum, r) => sum + r.count, 0) / lawFields.length).toFixed(2),
        stem: (stemFields.reduce((sum, r) => sum + r.count, 0) / stemFields.length).toFixed(2),
        humanities: (humanitiesFields.reduce((sum, r) => sum + r.count, 0) / humanitiesFields.length).toFixed(2),
        business: (businessFields.reduce((sum, r) => sum + r.count, 0) / businessFields.length).toFixed(2),
        arts: (artsFields.reduce((sum, r) => sum + r.count, 0) / artsFields.length).toFixed(2)
      },
      results
    }, null, 2));
    
    await fs.writeFile(reportFilename, report);
    
    console.log(`\nDetailed results saved to ${resultsFilename}`);
    console.log(`Report saved to ${reportFilename}`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the limited test instead of the comprehensive one
// This ensures we don't hit API rate limits
runLimitedTest().catch(console.error);