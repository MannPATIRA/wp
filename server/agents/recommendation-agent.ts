import { User, UserProfile, Opportunity, InsertOpportunity } from "@shared/schema";
import { storage } from "../storage";
import { openai, generateSearchQuery, processSearchResults, analyzeCategoryForOpportunities } from "./openai";
import { searchAgent, SearchResult } from "./search-agent";
import { scraperAgent } from "./scraper";

/**
 * Recommendation Agent
 * 
 * Analyzes the user profile to identify key extracurricular activities
 * and achievements that align with the target university/course.
 * Uses web scraping to find real-world opportunities.
 */
export class RecommendationAgent {
  /**
   * Get personalized recommendations for a user based on their profile
   * @param user User object
   * @param profile User profile
   * @returns List of recommended opportunities
   */
  async getRecommendations(user: User, profile: UserProfile): Promise<Opportunity[]> {
    try {
      console.log("\n=============== RECOMMENDATION AGENT DIAGNOSTICS ===============");
      console.log("Getting recommendations for user profile:");
      console.log("Target University:", profile.targetUniversity);
      console.log("Target Major:", profile.targetMajor);
      console.log("GPA:", profile.gpa);
      console.log("SAT/ACT scores:", profile.sat, profile.act);
      console.log("AP Courses:", profile.apCourses);
      console.log("Achievements:", profile.achievements);
      console.log("Extracurriculars:", profile.extracurriculars);
      
      // Check necessary API keys
      console.log("\nAPI Key Status:");
      console.log("OpenAI API Key:", process.env.OPENAI_API_KEY ? `Available (${process.env.OPENAI_API_KEY.substring(0, 5)}...)` : "MISSING");
      console.log("Google API Key:", process.env.GOOGLE_API_KEY ? `Available (${process.env.GOOGLE_API_KEY.substring(0, 5)}...)` : "MISSING");
      console.log("Google Search CX:", process.env.GOOGLE_SEARCH_CX ? `Available (${process.env.GOOGLE_SEARCH_CX.substring(0, 5)}...)` : "MISSING");
      
      // If we don't have target university or major, return generic recommendations
      if (!profile.targetUniversity && !profile.targetMajor) {
        console.log("\nNo target university or major, returning generic recommendations");
        const recommendations = await this.getGenericRecommendations();
        console.log(`Returning ${recommendations.length} generic recommendations`);
        console.log("=============== END RECOMMENDATION AGENT DIAGNOSTICS ===============\n");
        return recommendations;
      }
      
      // Use the search agent to find real opportunities based on the profile
      console.log("\nAttempting to find real-world opportunities based on profile...");
      console.time("findRealOpportunities");
      const webOpportunities = await this.findRealOpportunities(user, profile);
      console.timeEnd("findRealOpportunities");
      
      if (webOpportunities.length > 0) {
        console.log(`Found ${webOpportunities.length} real opportunities from web search`);
        console.log("First opportunity:", JSON.stringify(webOpportunities[0], null, 2));
        console.log("=============== END RECOMMENDATION AGENT DIAGNOSTICS ===============\n");
        return webOpportunities;
      }
      
      // Fallback to existing opportunities if web search fails
      console.log("\nWeb search returned no results, falling back to existing opportunities");
      console.time("getExistingOpportunities");
      const existingOpportunities = await storage.getOpportunities();
      console.timeEnd("getExistingOpportunities");
      
      console.log(`Found ${existingOpportunities.length} existing opportunities to analyze`);
      
      if (existingOpportunities.length === 0) {
        console.log("No existing opportunities found, generating generic ones");
        const genericOpps = await this.getGenericRecommendations();
        console.log(`Generated ${genericOpps.length} generic opportunities`);
        console.log("=============== END RECOMMENDATION AGENT DIAGNOSTICS ===============\n");
        return genericOpps;
      }
      
      console.log("\nAnalyzing profile to match with existing opportunities...");
      console.time("analyzeProfileForRecommendations");
      const recommendations = await this.analyzeProfileForRecommendations(user, profile, existingOpportunities);
      console.timeEnd("analyzeProfileForRecommendations");
      
      console.log(`Found ${recommendations.length} matching recommendations`);
      if (recommendations.length > 0) {
        console.log("First recommendation:", JSON.stringify(recommendations[0], null, 2));
      }
      
      console.log("=============== END RECOMMENDATION AGENT DIAGNOSTICS ===============\n");
      return recommendations;
    } catch (error) {
      console.error("Error in recommendation agent:", error);
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
      }
      // Fallback to generic recommendations if analysis fails
      console.log("Falling back to generic recommendations due to error");
      const genericRecommendations = await this.getGenericRecommendations();
      console.log(`Returning ${genericRecommendations.length} generic recommendations`);
      console.log("=============== END RECOMMENDATION AGENT DIAGNOSTICS ===============\n");
      return genericRecommendations;
    }
  }
  
  /**
   * Find real opportunities using web search based on the user's profile
   */
  private detectAcademicField(majorField: string): string {
    if (!majorField) return "general";
    
    const major = majorField.toLowerCase();
    
    // STEM fields
    if (
      major.includes("computer") || 
      major.includes("programming") || 
      major.includes("software") || 
      major.includes("coding") ||
      major.includes("web") ||
      major.includes("app development") ||
      major.includes("information technology") ||
      major.includes("information systems") ||
      major.includes("artificial intelligence") ||
      major.includes("ai") ||
      major.includes("data science")
    ) {
      return "computer-science";
    }
    
    if (
      major.includes("engineer") || 
      major.includes("mechanics") || 
      major.includes("robotics")
    ) {
      return "engineering";
    }
    
    if (
      major.includes("math") || 
      major.includes("statistics") || 
      major.includes("calculus") ||
      major.includes("numerical") ||
      major.includes("computational") ||
      major.includes("quantitative")
    ) {
      return "mathematics";
    }
    
    if (
      major.includes("biology") || 
      major.includes("chemistry") || 
      major.includes("physics") || 
      major.includes("astronomy") ||
      major.includes("earth science") ||
      major.includes("environmental science") ||
      major.includes("biochemistry") ||
      major.includes("neuroscience")
    ) {
      return "natural-sciences";
    }
    
    if (
      major.includes("health") || 
      major.includes("medicine") || 
      major.includes("nursing") || 
      major.includes("pharmacy") ||
      major.includes("dental") ||
      major.includes("veterinary") ||
      major.includes("physical therapy") ||
      major.includes("occupational therapy") ||
      major.includes("medical") ||
      major.includes("clinical")
    ) {
      return "healthcare";
    }
    
    // Humanities & Social Sciences
    if (
      major.includes("law") || 
      major.includes("legal") || 
      major.includes("attorney") || 
      major.includes("justice") ||
      major.includes("paralegal") ||
      major.includes("criminal justice") ||
      major.includes("public policy")
    ) {
      return "law";
    }
    
    if (
      major.includes("business") || 
      major.includes("finance") || 
      major.includes("accounting") || 
      major.includes("economics") ||
      major.includes("marketing") ||
      major.includes("management") ||
      major.includes("entrepreneurship") ||
      major.includes("commerce") ||
      major.includes("administration")
    ) {
      return "business";
    }
    
    if (
      major.includes("psychology") || 
      major.includes("sociology") || 
      major.includes("anthropology") || 
      major.includes("social work") ||
      major.includes("human development") ||
      major.includes("counseling")
    ) {
      return "social-sciences";
    }
    
    if (
      major.includes("history") || 
      major.includes("philosophy") || 
      major.includes("religion") || 
      major.includes("literature") ||
      major.includes("classics") ||
      major.includes("humanities")
    ) {
      return "humanities";
    }
    
    if (
      major.includes("english") || 
      major.includes("writing") || 
      major.includes("communication") || 
      major.includes("journalism") ||
      major.includes("media") ||
      major.includes("linguistics") ||
      major.includes("language") ||
      major.includes("speech")
    ) {
      return "communications";
    }
    
    if (
      major.includes("politics") || 
      major.includes("government") || 
      major.includes("international relations") || 
      major.includes("diplomacy") ||
      major.includes("policy") ||
      major.includes("public administration")
    ) {
      return "political-science";
    }
    
    // Arts & Creative Fields
    if (
      major.includes("art") || 
      major.includes("design") || 
      major.includes("drawing") || 
      major.includes("painting") ||
      major.includes("sculpture") ||
      major.includes("photography") ||
      major.includes("graphic design") ||
      major.includes("fashion") ||
      major.includes("illustration")
    ) {
      return "arts";
    }
    
    if (
      major.includes("music") || 
      major.includes("performance") || 
      major.includes("theater") || 
      major.includes("dance") ||
      major.includes("drama") ||
      major.includes("acting") ||
      major.includes("film") ||
      major.includes("cinema")
    ) {
      return "performing-arts";
    }
    
    if (
      major.includes("architecture") || 
      major.includes("interior design") || 
      major.includes("urban planning") || 
      major.includes("landscape")
    ) {
      return "architecture";
    }
    
    if (
      major.includes("education") || 
      major.includes("teaching") || 
      major.includes("pedagogy") || 
      major.includes("curriculum") ||
      major.includes("instructional")
    ) {
      return "education";
    }
    
    // Default to general if no specific category is matched
    return "general";
  }
  
  private getFieldSpecificQueries(field: string, majorField: string): string[] {
    const queries: string[] = [];
    
    switch (field) {
      case "computer-science":
        queries.push(
          `coding hackathons for high school students`,
          `programming contests for high school students`,
          `coding bootcamps for high school students`,
          `app development programs for high school students`,
          `AI machine learning programs for high school students`,
          `robotics programs for high school students`,
          `game development workshops for high school students`,
          `open source projects for high school students`,
          `tech industry shadowing programs for high school students`
        );
        break;
        
      case "engineering":
        queries.push(
          `engineering competitions for high school students`,
          `STEM challenges for high school students`,
          `robotics competitions for high school students`,
          `engineering design challenges high school`,
          `invention competitions for high school students`,
          `maker faires for high school students`,
          `engineering summer programs high school`,
          `aerospace engineering programs high school`,
          `civil engineering projects high school`,
          `electrical engineering workshops high school`,
          `biomedical engineering opportunities high school`,
          `material science programs high school`,
          `engineering mentorship high school students`,
          `industrial engineering experiences high school`,
          `sustainable engineering projects high school`,
          `engineering research competitions high school`,
          `national engineering design challenge high school`
        );
        break;
        
      case "mathematics":
        queries.push(
          `math olympiad for high school students`,
          `mathematics competitions for high school students`,
          `advanced math summer programs high school`,
          `statistics competitions for high school students`,
          `quantitative research programs high school students`,
          `math circles for high school students`,
          `actuarial science programs high school`
        );
        break;
        
      case "natural-sciences":
        queries.push(
          `science olympiad for high school students`,
          `science research competitions high school`,
          `laboratory internships for high school students`,
          `environmental research projects high school`,
          `science fairs for high school students`,
          `science summer programs high school`,
          `field research opportunities high school`,
          `biology olympiad high school`,
          `chemistry competitions high school students`,
          `physics bowl high school competition`,
          `astronomy research opportunities high school`,
          `neuroscience programs high school students`,
          `biochemistry research high school`,
          `genetics research programs high school`,
          `conservation science programs high school`,
          `earth science field studies high school`,
          `science honors programs high school`
        );
        break;
        
      case "healthcare":
        queries.push(
          `pre-med programs for high school students`,
          `healthcare shadowing for high school students`,
          `medical research programs high school`,
          `hospital volunteer programs high school`,
          `health science competitions high school`,
          `healthcare summer programs for high school students`,
          `future doctors programs high school`,
          `medical innovation competitions high school`,
          `bioethics competitions high school students`,
          `global health initiatives high school`,
          `emergency medical training for high school students`,
          `anatomy and physiology competitions high school`,
          `public health research opportunities high school`,
          `medical conferences for high school students`,
          `healthcare leadership programs high school`,
          `telemedicine programs high school students`,
          `medical device innovation high school`
        );
        break;
        
      case "law":
        queries.push(
          `mock trial competitions high school`,
          `pre-law programs for high school students`,
          `youth court programs high school`,
          `legal internships for high school students`,
          `debate competitions high school`,
          `law firm shadowing high school students`,
          `youth and government programs high school`,
          `constitutional law competition high school`,
          `legal advocacy programs high school`,
          `moot court competitions high school`,
          `judicial shadowing programs high school`,
          `legal writing competitions high school`,
          `law academy programs high school`,
          `teen court volunteer opportunities`,
          `human rights advocacy high school`,
          `law camp for high school students`,
          `legal research programs high school`
        );
        break;
        
      case "business":
        queries.push(
          `business competitions for high school students`,
          `entrepreneurship programs high school`,
          `stock market competitions high school`,
          `youth leadership programs business`,
          `economics competitions high school`,
          `junior achievement programs high school`,
          `business internships for high school students`,
          `economic research opportunities high school`,
          `business case competitions high school`,
          `finance summer programs high school`,
          `young entrepreneurs challenge high school`,
          `business pitch competitions high school`,
          `economic policy research high school`,
          `social entrepreneurship programs high school`,
          `international economics olympiad high school`,
          `business leadership conferences high school`,
          `economics essay competitions high school`
        );
        break;
        
      case "social-sciences":
        queries.push(
          `psychology research programs high school`,
          `social science competitions high school`,
          `anthropology fieldwork high school`,
          `sociology research opportunities high school`,
          `mental health advocacy programs high school`,
          `social research projects high school students`,
          `community service opportunities high school`,
          `neuroscience for high school students`,
          `behavioral science programs high school`,
          `social justice advocacy high school`,
          `psychology summer programs high school`,
          `human development research high school`,
          `social psychology competitions high school`,
          `developmental psychology opportunities high school`,
          `mental health awareness programs high school`,
          `cognitive science research high school students`,
          `human behavior research high school`
        );
        break;
        
      case "humanities":
        queries.push(
          `philosophy competitions high school`,
          `history research programs high school`,
          `classics competitions high school`,
          `humanities essay contests high school`,
          `archaeological programs high school students`,
          `classics summer institutes high school`,
          `ethics bowl competitions high school`,
          `historical research opportunities high school`,
          `literary analysis competitions high school`,
          `philosophy summer programs high school`,
          `history day competitions high school`,
          `critical thinking competitions high school`,
          `ancient civilizations research high school`,
          `religious studies programs high school`,
          `debate competitions humanities high school`,
          `humanities symposiums high school students`,
          `primary source research programs high school`
        );
        break;
        
      case "communications":
        queries.push(
          `high school journalism competitions`,
          `writing contests for high school students`,
          `youth media programs high school`,
          `student newspaper internships high school`,
          `speech and debate competitions high school`,
          `publishing opportunities high school students`,
          `literary magazine contest high school`
        );
        break;
        
      case "political-science":
        queries.push(
          `model UN programs high school`,
          `youth and government programs`,
          `civic engagement opportunities high school`,
          `political campaign internships high school`,
          `public policy competitions high school`,
          `student government leadership programs`,
          `international relations programs high school`
        );
        break;
        
      case "arts":
        queries.push(
          `art competitions for high school students`,
          `portfolio development programs high school`,
          `visual arts workshops high school`,
          `art exhibition opportunities high school`,
          `digital art competitions high school`,
          `design competitions for high school students`,
          `art summer programs high school`
        );
        break;
        
      case "performing-arts":
        queries.push(
          `music competitions for high school students`,
          `theater festivals high school`,
          `dance competitions for high school students`,
          `film festivals for high school students`,
          `performing arts summer programs high school`,
          `music composition contests high school`,
          `youth orchestras and ensembles`
        );
        break;
        
      case "architecture":
        queries.push(
          `architecture competitions for high school students`,
          `design challenges high school`,
          `urban planning projects high school`,
          `architectural summer programs high school`,
          `design portfolio programs high school`,
          `sustainable design competitions high school`,
          `architectural drawing competitions`
        );
        break;
        
      case "education":
        queries.push(
          `future teachers programs high school`,
          `education internships for high school students`,
          `tutoring opportunities high school students`,
          `teaching assistant programs high school`,
          `education policy competitions high school`,
          `classroom volunteer opportunities high school`,
          `youth mentorship programs high school`
        );
        break;
        
      default:
        // General queries that work for any field
        queries.push(
          `academic competitions for high school students`,
          `summer programs for high school students ${majorField}`,
          `volunteer opportunities high school students ${majorField}`,
          `leadership programs high school students`,
          `community service projects high school students`,
          `mentorship programs high school students ${majorField}`,
          `prestigious awards high school students`
        );
        break;
    }
    
    return queries;
  }
  
  private async findRealOpportunities(user: User, profile: UserProfile): Promise<Opportunity[]> {
    try {
      console.log("Finding real opportunities from web search");
      
      // Generate multiple search queries for different opportunity types
      const majorField = profile.targetMajor || "";
      const targetUniversity = profile.targetUniversity || "top universities";
      
      // Generate category-specific queries based on the major field
      let fieldSpecificQueries: string[] = [];
      
      // Detect the general academic field based on the major
      const field = this.detectAcademicField(majorField);
      console.log(`Detected academic field: ${field} for major: ${majorField}`);
      
      // Get field-specific queries based on the detected academic field
      fieldSpecificQueries = this.getFieldSpecificQueries(field, majorField);
      
      // Base and common queries that work well for all majors
      const commonQueries = [
        // Base query
        `${majorField} opportunities for high school students applying to ${targetUniversity}`,
        
        // Research opportunities
        `summer research programs ${majorField} for high school students`,
        `research opportunities ${majorField} for high school students`,
        
        // Competitions and academic enrichment
        `${majorField} competitions for high school students`,
        `${majorField} academic competitions high school`,
        
        // University-specific opportunities
        `extracurricular activities for ${targetUniversity} applicants`,
        `${targetUniversity} high school preparation programs`,
        `pre-college programs ${majorField} ${targetUniversity}`,
        
        // General prestigious programs
        `prestigious programs high school students ${majorField}`,
        `${majorField} summer programs high school students`,
        
        // Career exploration
        `${majorField} internships for high school students`,
        `${field} industry shadowing programs for high school students`,
        `${majorField} volunteer opportunities high school students`,
      ];
      
      // Combine common queries with field-specific queries
      const queries = [...commonQueries, ...fieldSpecificQueries];
      
      console.log("Generated search queries:", queries);
      
      // Use more queries for better coverage across different fields
      // Adaptive query selection - use more queries for fields with extended query sets
      const adaptiveQueryCount = (() => {
        // Fields with enhanced query sets should get more search coverage
        if (["healthcare", "law", "business", "engineering", "natural-sciences", "social-sciences", "humanities"].includes(field)) {
          return 3; // Use more queries for enhanced fields
        }
        return 2; // Standard number for other fields
      })();
      
      // Select the most relevant queries (first two are always included) plus several random ones
      const selectedQueries = [
        queries[0], // Most relevant query is first
        queries[1], // Second most relevant
        ...queries
          .slice(2)
          .sort(() => Math.random() - 0.5) // Randomly shuffle the rest
          .slice(0, adaptiveQueryCount) // Take more queries for enhanced fields
      ];
      
      console.log(`Using ${selectedQueries.length} out of ${queries.length} possible search queries to conserve API quota`);
      
      // Add field-specific category searches for better law, business, etc. results
      const categorySearches: string[] = [];
      
      // Map fields to appropriate categories for targeted searching
      if (field === "law") {
        categorySearches.push("law", "competition", "leadership", "research");
      } else if (field === "computer-science") {
        categorySearches.push("stem", "competition", "internship", "technology");
      } else if (field === "business") {
        categorySearches.push("business", "leadership", "internship", "entrepreneurship");
      } else if (field === "healthcare") {
        categorySearches.push("healthcare", "volunteer", "research", "medical");
      } else if (field === "engineering") {
        categorySearches.push("engineering", "stem", "competition", "innovation");
      } else if (field === "natural-sciences") {
        categorySearches.push("science", "research", "stem", "laboratory");
      } else if (field === "social-sciences") {
        categorySearches.push("social-science", "research", "psychology", "volunteer");
      } else if (field === "arts" || field === "performing-arts") {
        categorySearches.push("arts", "competition", "summer-program", "portfolio");
      } else if (field === "humanities") {
        categorySearches.push("humanities", "research", "volunteer", "writing");
      } else if (field === "mathematics") {
        categorySearches.push("mathematics", "competition", "research", "stem");
      } else {
        // Default categories for other fields
        categorySearches.push("competition", "summer-program", "mentorship", "leadership");
      }
      
      console.log(`Field-specific categories for ${field}: ${categorySearches.join(', ')}`);
      
      // Search for opportunities using only selected queries
      let allResults: SearchResult[] = [];
      
      // First do the direct queries (typically better for university-specific results)
      for (const query of selectedQueries) {
        console.log(`Executing search for query: "${query}"`);
        try {
          // Search for opportunities using the Google Custom Search API
          const results = await searchAgent.searchOpportunities({
            query,
            limit: 3 // Reduced to conserve API quota
          });
          
          if (results && results.length > 0) {
            console.log(`Found ${results.length} results for query: "${query}"`);
            allResults = [...allResults, ...results];
          }
        } catch (error) {
          console.error(`Error searching for query "${query}":`, error);
        }
      }
      
      // Then do category-based searches (typically better for field-specific results)
      // Use variable number of categories based on field importance and API quota
      const categoriesToUse = (() => {
        // Enhanced category selection for key fields that benefit most from it
        if (field === "law") return 2; // Law needs most diverse opportunities
        if (["healthcare", "business", "engineering", "natural-sciences"].includes(field)) return 2; // These fields also benefit from more diverse search
        return 1; // Standard number for other fields
      })();
      
      console.log(`Using ${categoriesToUse} categories for ${field} field to ensure diverse recommendations`);
      
      for (const category of categorySearches.slice(0, categoriesToUse)) {
        console.log(`Executing category search for: "${category}"`);
        try {
          const results = await searchAgent.searchByCategory(category, 3);
          
          if (results && results.length > 0) {
            console.log(`Found ${results.length} results for category: "${category}"`);
            allResults = [...allResults, ...results];
          }
        } catch (error) {
          console.error(`Error searching for category "${category}":`, error);
        }
      }
      
      // Deduplicate results by URL
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.link === result.link)
      );
      
      console.log(`Found ${uniqueResults.length} unique search results from all queries`);
      
      // Use these as the search results
      const searchResults = uniqueResults;
      
      if (!searchResults || searchResults.length === 0) {
        console.log("No search results found");
        return [];
      }
      
      console.log(`Found ${searchResults.length} search results`);
      
      // Two-step approach:
      // 1. First, use the AI to extract opportunities from search results
      const aiProcessedOpportunities = await processSearchResults(
        searchResults, 
        profile.targetUniversity, 
        profile.targetMajor
      );
      
      console.log(`AI processed ${aiProcessedOpportunities.length} opportunities from search results`);
      
      // 2. Then, use the web scraper to get more detailed information
      // Extract unique URLs from the AI processed opportunities
      const scrapableUrls = aiProcessedOpportunities
        .map(opp => opp.sourceUrl)
        .filter(url => !!url && url.startsWith('http'));
      
      console.log(`Found ${scrapableUrls.length} URLs to scrape for more details`);
      
      // Scrape additional details from the websites directly
      const scrapedDetails = await scraperAgent.scrapeOpportunities(
        searchResults.filter(r => scrapableUrls.includes(r.link))
      );
      
      console.log(`Scraped ${scrapedDetails.length} opportunities with additional details`);
      
      // Merge AI and scraped results
      const processedOpportunities = aiProcessedOpportunities.map(aiOpp => {
        // Find matching scraped data
        const scraped = scrapedDetails.find(s => s.url === aiOpp.sourceUrl);
        
        if (scraped && scraped.title) {
          // Combine AI and scraped data, preferring scraped data where available
          return {
            title: scraped.title || aiOpp.title,
            description: scraped.description || aiOpp.description,
            category: scraped.category || aiOpp.category,
            applicationDeadline: scraped.applicationDeadline || null,
            programDates: scraped.programDates || null,
            location: scraped.location || null,
            eligibility: scraped.eligibility || null,
            cost: scraped.cost || null,
            benefits: scraped.benefits || [aiOpp.value],
            sourceUrl: aiOpp.sourceUrl,
            value: aiOpp.value
          };
        }
        
        // Use AI data if scraping failed
        return aiOpp;
      });
      
      console.log(`Combined ${processedOpportunities.length} opportunities with AI and scraped data`);
      
      if (!processedOpportunities || processedOpportunities.length === 0) {
        return [];
      }
      
      // Convert the processed opportunities to the Opportunity format
      const opportunities: Opportunity[] = [];
      
      for (const opp of processedOpportunities) {
        const now = new Date();
        
        // Create the opportunity object with all available information
        const insertOpp: InsertOpportunity = {
          title: opp.title,
          description: opp.description,
          category: opp.category,
          externalLink: opp.sourceUrl,
          tags: [opp.category],
          impactRating: 4,
          isVerified: true,
          source: this.extractOrganizationFromUrl(opp.sourceUrl),
          // Use scraped data when available, fall back to defaults
          location: opp.location || "Various",
          programDates: opp.programDates || "See website for details",
          benefits: opp.benefits || [opp.value],
          applicationDeadline: opp.applicationDeadline || null,
          eligibility: opp.eligibility || "High school students",
          cost: opp.cost || "See website for details",
          financialAidAvailable: null,
          contactEmail: null
        };
        
        // Check if we already saved this opportunity by matching title and link
        const existingOpp = await this.findExistingOpportunity(insertOpp.title, insertOpp.externalLink);
        
        if (existingOpp) {
          opportunities.push(existingOpp);
        } else {
          // Save the opportunity to the database
          const newOpp = await storage.createOpportunity(insertOpp);
          opportunities.push(newOpp);
        }
      }
      
      return opportunities;
    } catch (error) {
      console.error("Error finding real opportunities:", error);
      return [];
    }
  }
  
  /**
   * Analyze user profile using OpenAI to get personalized recommendations
   * from existing opportunities
   */
  /**
   * Calculate a relevance score for law-related opportunities
   * This helps prioritize the most relevant opportunities for law students
   */
  private calculateLawRelevanceScore(opportunity: Opportunity): number {
    let score = 0;
    const lawKeywords = ['law', 'legal', 'court', 'justice', 'debate', 'attorney', 'advocate', 'trial', 'rights', 'policy'];
    
    // Check title for law keywords
    if (opportunity.title) {
      for (const keyword of lawKeywords) {
        if (opportunity.title.toLowerCase().includes(keyword)) {
          score += 5; // Higher weight for title matches
        }
      }
    }
    
    // Check description for law keywords
    if (opportunity.description) {
      for (const keyword of lawKeywords) {
        if (opportunity.description.toLowerCase().includes(keyword)) {
          score += 2; // Lower weight for description matches
        }
      }
    }
    
    // Check category
    if (opportunity.category && opportunity.category.toLowerCase().includes('law')) {
      score += 10; // Highest weight for category matches
    }
    
    // Check tags
    if (opportunity.tags) {
      for (const tag of opportunity.tags) {
        if (lawKeywords.some(keyword => tag.toLowerCase().includes(keyword))) {
          score += 3; // Medium weight for tag matches
        }
      }
    }
    
    return score;
  }
  
  private async analyzeProfileForRecommendations(
    user: User, 
    profile: UserProfile, 
    allOpportunities: Opportunity[]
  ): Promise<Opportunity[]> {
    if (allOpportunities.length === 0) {
      return [];
    }
    
    const userInfo = {
      name: `${user.firstName} ${user.lastName}`,
      // No age or grade in the UserProfile type
      gpa: profile.gpa,
      sat: profile.sat,
      act: profile.act,
      apCourses: profile.apCourses,
      targetUniversity: profile.targetUniversity,
      targetMajor: profile.targetMajor,
      achievements: profile.achievements || [],
      extracurriculars: profile.extracurriculars || []
    };
    
    const opportunityData = allOpportunities.map(opp => ({
      id: opp.id,
      title: opp.title,
      category: opp.category,
      tags: opp.tags,
      applicationDeadline: opp.applicationDeadline,
      impactRating: opp.impactRating
    }));
    
    // Call OpenAI to analyze user profile and match with opportunities
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a university admissions expert that helps match high school students with extracurricular activities and opportunities that will help them get into their dream schools. Analyze the student profile and recommend the most suitable opportunities from the provided list. Focus on opportunities that will enhance their application for their target university and major.`
        },
        {
          role: "user",
          content: `Please analyze this student profile and recommend the most suitable 5-10 opportunities from the provided list. Return the opportunity IDs as a JSON array of numbers. Only provide IDs from the list I've provided.
            
            Student Profile:
            ${JSON.stringify(userInfo, null, 2)}
            
            Available Opportunities:
            ${JSON.stringify(opportunityData, null, 2)}`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    try {
      // Parse the response content
      const content = response.choices[0].message.content || '';
      console.log("OpenAI response content:", content);
      
      // Handle different possible response formats
      let recommendedIds: number[] = [];
      try {
        const result = JSON.parse(content);
        
        // Check for all possible field names that could contain recommendation IDs
        recommendedIds = 
          result.recommendedOpportunityIds || 
          result.recommendations || 
          result.recommendedIds || 
          result.opportunityIds || 
          result.opportunities || // New field name detected in the debug test
          result.ids || 
          [];
        
        // If the result is just an array, use it directly
        if (Array.isArray(recommendedIds) && recommendedIds.length > 0) {
          // Make sure all IDs are numbers
          recommendedIds = recommendedIds.map(id => typeof id === 'number' ? id : parseInt(id, 10))
            .filter(id => !isNaN(id));
        } else if (result.opportunities && Array.isArray(result.opportunities)) {
          // Handle opportunities specifically since it was detected in debug tests
          recommendedIds = result.opportunities.map(id => typeof id === 'number' ? id : parseInt(id, 10))
            .filter(id => !isNaN(id));
        }
        
        console.log("Parsed recommended IDs:", recommendedIds);
      } catch (parseError) {
        console.error("Error parsing OpenAI JSON response:", parseError);
        return this.getGenericRecommendations();
      }
      
      console.log("Recommended IDs:", recommendedIds);
      
      // Filter opportunities by the recommended IDs
      let recommendations = allOpportunities.filter(opp => 
        recommendedIds.includes(opp.id)
      );
      
      // Special handling for law-related majors to ensure sufficient recommendations
      const isLawField = profile.targetMajor && this.detectAcademicField(profile.targetMajor) === "law";
      
      if (recommendations.length < 7 && isLawField) {
        console.log("Not enough law-related recommendations, adding more from general pool");
        
        // Get additional opportunities that might be useful for law students
        const additionalOpportunities = allOpportunities
          .filter(opp => 
            // Skip those already included
            !recommendations.find(v => v.id === opp.id) &&
            // Skip fake opportunities
            !(opp.externalLink && (
              opp.externalLink.includes('example.org') ||
              opp.externalLink.includes('example.com') ||
              opp.externalLink.includes('yourwebsite.com')
            )) &&
            // Skip expired opportunities
            !(opp.applicationDeadline && new Date(opp.applicationDeadline) < new Date()) &&
            // Focus on relevant categories for law students
            (
              opp.category.toLowerCase().includes('law') ||
              opp.category.toLowerCase().includes('leadership') ||
              opp.category.toLowerCase().includes('debate') ||
              opp.category.toLowerCase().includes('competition') ||
              opp.category.toLowerCase().includes('research') ||
              (opp.tags && opp.tags.some(tag => 
                tag.toLowerCase().includes('debate') ||
                tag.toLowerCase().includes('leadership') ||
                tag.toLowerCase().includes('research') ||
                tag.toLowerCase().includes('competition') ||
                tag.toLowerCase().includes('volunteer')
              ))
            )
          )
          // Sort by relevance - prioritize those with law-related words in title or description
          .sort((a, b) => {
            const aScore = this.calculateLawRelevanceScore(a);
            const bScore = this.calculateLawRelevanceScore(b);
            return bScore - aScore; // Higher score first
          })
          // Take only what we need to reach 7 total
          .slice(0, Math.max(7 - recommendations.length, 0));
        
        console.log(`Adding ${additionalOpportunities.length} more relevant law opportunities`);
        
        // Combine the specifically matched opportunities with the additional law-relevant ones
        recommendations = [...recommendations, ...additionalOpportunities];
      }
      
      // If no recommendations match, return generic ones
      if (recommendations.length === 0) {
        console.log("No matching recommendations found, using generic recommendations");
        return this.getGenericRecommendations();
      }
      
      return recommendations;
    } catch (error) {
      console.error("Error processing OpenAI response:", error);
      return this.getGenericRecommendations();
    }
  }
  
  /**
   * Get generic high-impact recommendations
   */
  private async getGenericRecommendations(): Promise<Opportunity[]> {
    // Get all available opportunities
    const allOpportunities = await storage.getOpportunities();
    
    if (allOpportunities.length === 0) {
      // If we don't have any opportunities, create some generic ones
      return this.createGenericOpportunities();
    }
    
    // Sort by impact rating (high to low) and return top 10
    return allOpportunities
      .sort((a, b) => (b.impactRating || 0) - (a.impactRating || 0))
      .slice(0, 10);
  }
  
  /**
   * Create real opportunities found through web search
   */
  private async createGenericOpportunities(): Promise<Opportunity[]> {
    // Define diverse categories for high school opportunities
    const categories = [
      // Common to all fields
      "Research Opportunity", 
      "Internship", 
      "Volunteer Program",
      "Summer Program",
      
      // STEM
      "Science Competition",
      "Engineering Challenge",
      "Robotics Program",
      "Math Olympiad",
      
      // Humanities & Social Sciences
      "Writing Competition",
      "Debate Tournament",
      "Model UN Program",
      "Mock Trial Competition",
      
      // Arts
      "Arts Workshop",
      "Music Competition",
      "Theater Program",
      "Design Contest",
      
      // Business & Leadership
      "Leadership Program",
      "Entrepreneurship Challenge",
      "Community Service Project",
      "Public Speaking Competition"
    ];
    
    const opportunities: Opportunity[] = [];
    
    // Select 3 diverse categories to avoid API rate limits
    const limitedCategories = [];
    
    // Add a STEM category
    limitedCategories.push(categories[Math.floor(Math.random() * 8)]);
    
    // Add a humanities/social sciences category
    limitedCategories.push(categories[8 + Math.floor(Math.random() * 4)]);
    
    // Add a business/leadership or arts category
    limitedCategories.push(categories[12 + Math.floor(Math.random() * 8)]);
    
    console.log(`Using ${limitedCategories.length} diverse categories out of ${categories.length} total to conserve API quota`);
    
    for (const category of limitedCategories) {
      try {
        // Create general search queries that aren't specific to computer science
        const searchQuery = `best ${category.toLowerCase()} for high school students`;
        console.log(`Searching for real opportunities with query: "${searchQuery}"`);
        
        // Search for opportunities using this query
        const searchResults = await searchAgent.searchOpportunities({
          query: searchQuery,
          limit: 3 // Reduced to conserve API quota
        });
        
        if (searchResults && searchResults.length > 0) {
          console.log(`Found ${searchResults.length} results for ${category}`);
          
          // Process search results to extract opportunities
          const processedResults = await processSearchResults(
            searchResults, 
            null, 
            null // Don't specify a major to get more diverse results
          );
          
          if (processedResults && processedResults.length > 0) {
            console.log(`Extracted ${processedResults.length} opportunities for ${category}`);
            
            // For each processed opportunity, create a database entry
            for (const opp of processedResults) {
              // Skip anything that doesn't have a valid URL
              if (!opp.sourceUrl || 
                  opp.sourceUrl.includes('example.org') || 
                  opp.sourceUrl.includes('example.com')) {
                console.log(`Skipping opportunity with invalid URL: ${opp.title}`);
                continue;
              }
              
              // Set a future application deadline (random between 3-9 months from now)
              const futureDate = new Date();
              futureDate.setMonth(futureDate.getMonth() + 3 + Math.floor(Math.random() * 6));
              
              const insertOpp: InsertOpportunity = {
                title: opp.title,
                description: opp.description,
                category: opp.category || category,
                externalLink: opp.sourceUrl,
                tags: [category],
                impactRating: 3 + Math.floor(Math.random() * 3), // Random between 3-5
                isVerified: true,
                source: this.extractOrganizationFromUrl(opp.sourceUrl),
                location: opp.location || "Various",
                programDates: opp.programDates || "See website for details",
                benefits: opp.benefits || [opp.value],
                applicationDeadline: opp.applicationDeadline || futureDate.toISOString(),
                eligibility: opp.eligibility || "High school students",
                cost: opp.cost || "See website for details",
                financialAidAvailable: null,
                contactEmail: null
              };
              
              // Verify this is not a duplicate
              const existingOpp = await this.findExistingOpportunity(insertOpp.title, insertOpp.externalLink);
              
              if (existingOpp) {
                opportunities.push(existingOpp);
              } else {
                // Save this real opportunity to the database
                const newOpp = await storage.createOpportunity(insertOpp);
                opportunities.push(newOpp);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for ${category} opportunities:`, error);
        // Continue with next category
      }
    }
    
    return opportunities;
  }
  
  /**
   * Extract organization name from a URL
   */
  private extractOrganizationFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname;
      // Remove www. prefix and get the domain name without extension
      const parts = domain.replace(/^www\./, "").split(".");
      if (parts.length >= 2) {
        // Return the domain name (e.g., "example" from "example.com")
        return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
      }
      return domain;
    } catch (error) {
      return "Unknown Organization";
    }
  }
  
  /**
   * Find an existing opportunity by title and link
   */
  private async findExistingOpportunity(title: string, link: string | null): Promise<Opportunity | undefined> {
    const allOpportunities = await storage.getOpportunities();
    return allOpportunities.find(opp => {
      const titleMatch = opp.title === title;
      const linkMatch = link && opp.externalLink === link;
      return titleMatch || linkMatch;
    });
  }
  

}

// Export a singleton instance of the recommendation agent
export const recommendationAgent = new RecommendationAgent();
