import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertUserProfileSchema, 
  insertTimelineEventSchema, 
  insertUserOpportunitySchema,
  InsertOpportunity 
} from "@shared/schema";
import { openAIAgent } from "./agents/openai-agent";
import { searchAgent } from "./agents/search-agent";
import { recommendationAgent } from "./agents/recommendation-agent";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // User profile routes
  app.get("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const profile = await storage.getUserProfile(req.user!.id);
    res.json(profile || null);
  });

  app.post("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      // Get the form data but don't convert dates - keep them as strings
      const requestData = { ...req.body };
      
      // Log the received data for debugging
      console.log("Profile API received data:", JSON.stringify(requestData, null, 2));
      
      // We keep applicationDeadline as a string here and let the storage layer handle the conversion
      // DO NOT convert to Date here, as it causes issues with PostgreSQL timestamp handling
      
      const profileData = insertUserProfileSchema.parse({
        ...requestData,
        userId: req.user!.id
      });
      
      const existingProfile = await storage.getUserProfile(req.user!.id);
      let profile;
      
      if (existingProfile) {
        profile = await storage.updateUserProfile(req.user!.id, profileData);
      } else {
        profile = await storage.createUserProfile(profileData);
      }
      
      res.status(200).json(profile);
    } catch (error) {
      console.error("Profile save error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save profile" });
    }
  });

  // Opportunities routes
  app.get("/api/opportunities", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const opportunities = category 
        ? await storage.getOpportunitiesByCategory(category)
        : await storage.getOpportunities();
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  app.get("/api/opportunities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const opportunity = await storage.getOpportunity(id);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      res.json(opportunity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch opportunity" });
    }
  });

  // User opportunities routes
  app.get("/api/user/opportunities", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userOpportunities = await storage.getUserOpportunities(req.user!.id);
      
      // Get full opportunity details for each user opportunity
      const opportunitiesWithDetails = await Promise.all(
        userOpportunities.map(async (userOpp) => {
          const opportunity = await storage.getOpportunity(userOpp.opportunityId);
          return {
            ...userOpp,
            opportunity
          };
        })
      );
      
      res.json(opportunitiesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user opportunities" });
    }
  });

  app.post("/api/user/opportunities", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userOpportunityData = insertUserOpportunitySchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const userOpportunity = await storage.saveOpportunity(userOpportunityData);
      res.status(201).json(userOpportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save opportunity" });
    }
  });

  app.patch("/api/user/opportunities/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const id = parseInt(req.params.id);
      const updatedUserOpportunity = await storage.updateUserOpportunity(id, req.body);
      
      if (!updatedUserOpportunity) {
        return res.status(404).json({ message: "User opportunity not found" });
      }
      
      res.json(updatedUserOpportunity);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user opportunity" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const notifications = await storage.getNotifications(req.user!.id, limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Timeline routes
  app.get("/api/timeline", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const events = await storage.getTimelineEvents(req.user!.id);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timeline events" });
    }
  });

  app.post("/api/timeline", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      // Get the form data but don't convert dates - keep them as strings
      const requestData = { ...req.body };
      
      // Log the received data for debugging
      console.log("Timeline API received data:", JSON.stringify(requestData, null, 2));
      
      // We keep eventDate as a string here and let the storage layer handle the conversion
      // DO NOT convert to Date here, as it causes issues with PostgreSQL timestamp handling
      
      const eventData = insertTimelineEventSchema.parse({
        ...requestData,
        userId: req.user!.id
      });
      
      const event = await storage.createTimelineEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Timeline event creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create timeline event" });
    }
  });

  // Recommendations route
  app.get("/api/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      console.log("\n=== RECOMMENDATIONS DEBUGGING START ===");
      console.log("Fetching recommendations for user ID:", req.user!.id);
      
      // Check that relevant API keys are set
      console.log("OpenAI API Key available:", !!process.env.OPENAI_API_KEY);
      console.log("Google API Key available:", !!process.env.GOOGLE_API_KEY);
      console.log("Google Search CX available:", !!process.env.GOOGLE_SEARCH_CX);
      
      // Get user and profile
      const userProfile = await storage.getUserProfile(req.user!.id);
      const user = await storage.getUser(req.user!.id);
      
      console.log("User:", JSON.stringify(user, null, 2));
      
      if (!userProfile) {
        console.log("User profile not found for recommendations");
        console.log("=== RECOMMENDATIONS DEBUGGING END ===\n");
        return res.status(400).json({ 
          message: "User profile not found. Please complete your profile first.",
          debug: "Missing user profile data" 
        });
      }
      
      console.log("Found user profile for recommendations:", JSON.stringify(userProfile, null, 2));
      
      let recommendations: any[] = [];
      
      // First try using the recommendation agent (which does web search)
      try {
        console.log("Using recommendation agent to find real-world opportunities");
        console.log("Agent params - target university:", userProfile.targetUniversity, "target major:", userProfile.targetMajor);
        
        // Measure execution time
        const startTime = Date.now();
        const opportunities = await recommendationAgent.getRecommendations(user!, userProfile);
        const endTime = Date.now();
        
        console.log(`Found ${opportunities?.length || 0} opportunities using recommendation agent (took ${endTime - startTime}ms)`);
        
        if (opportunities && opportunities.length > 0) {
          console.log("First opportunity:", JSON.stringify(opportunities[0], null, 2));
          recommendations = opportunities;
        } else {
          console.log("No opportunities found with recommendation agent, falling back to OpenAI");
          
          // Fallback to openAIAgent if recommendation agent returns no results
          try {
            console.log("Calling OpenAI to generate recommendations");
            
            // Measure execution time
            const startTime = Date.now();
            const aiRecommendations = await openAIAgent.getRecommendations({
              userProfile
            });
            const endTime = Date.now();
            
            console.log(`Generated ${aiRecommendations?.length || 0} recommendations from OpenAI (took ${endTime - startTime}ms)`);
            
            if (aiRecommendations && aiRecommendations.length > 0) {
              console.log("First recommendation from OpenAI:", JSON.stringify(aiRecommendations[0], null, 2));
              recommendations = aiRecommendations;
            }
          } catch (openAIError) {
            console.error("OpenAI error:", openAIError);
            console.error("OpenAI error stack:", openAIError instanceof Error ? openAIError.stack : "No stack trace");
            throw new Error("Failed to generate recommendations from OpenAI: " + 
              (openAIError instanceof Error ? openAIError.message : String(openAIError)));
          }
        }
      } catch (recommendationError) {
        console.error("Recommendation agent error:", recommendationError);
        console.error("Error stack:", recommendationError instanceof Error ? recommendationError.stack : "No stack trace");
        throw new Error("Failed to generate recommendations: " + 
          (recommendationError instanceof Error ? recommendationError.message : String(recommendationError)));
      }
      
      // Final check and response
      if (recommendations.length === 0) {
        console.log("WARNING: No recommendations were generated by any method");
        console.log("Getting fallback generic recommendations");
        
        // Get generic recommendations from storage as a last resort
        recommendations = await storage.getOpportunities(10);
      }
      
      // Filter out any opportunities with example.org or example.com URLs
      // and only show opportunities with deadlines in the future or no deadline
      const currentDate = new Date();
      const filteredRecommendations = recommendations.filter(opp => {
        // Filter out fake opportunities with example.org/example.com URLs
        if (opp.externalLink && 
            (opp.externalLink.includes('example.org') || 
             opp.externalLink.includes('example.com'))) {
          console.log(`Filtering out fake opportunity: ${opp.title} (${opp.externalLink})`);
          return false;
        }
        
        // Only include opportunities with future deadlines or no deadline
        if (opp.applicationDeadline) {
          const deadlineDate = new Date(opp.applicationDeadline);
          if (deadlineDate <= currentDate) {
            console.log(`Filtering out expired opportunity: ${opp.title} (deadline: ${opp.applicationDeadline})`);
            return false;
          }
        }
        
        return true;
      });
      
      console.log(`Filtered from ${recommendations.length} to ${filteredRecommendations.length} valid recommendations`);
      console.log("=== RECOMMENDATIONS DEBUGGING END ===\n");
      
      return res.json(filteredRecommendations);
    } catch (error) {
      console.error("Error in recommendations endpoint:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      console.log("=== RECOMMENDATIONS DEBUGGING END ===\n");
      
      // Check if headers have already been sent
      if (!res.headersSent) {
        return res.status(500).json({ 
          message: "Failed to generate recommendations: " + (error instanceof Error ? error.message : String(error)),
          debug: "General error in recommendations endpoint"
        });
      }
    }
  });

  // Search opportunities route
  app.post("/api/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const { query, category } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Use Search Agent to search for opportunities
      const results = await searchAgent.searchOpportunities({
        query,
        category
      });
      
      res.json(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to perform search", error: errorMessage });
    }
  });

  // Test route for Google Search API (for development testing)
  app.get("/api/test-search", async (req, res) => {
    try {
      const query = req.query.q as string || "high school summer research programs";
      // Check for raw option to skip OpenAI processing and just return Google results
      const rawResults = req.query.raw === "true";
      
      console.log(`Testing Google Search with query: ${query}${rawResults ? " (raw results only)" : ""}`);
      
      // Log Google API key info (first 5 chars only for security)
      const apiKey = process.env.GOOGLE_API_KEY || '';
      const cxId = process.env.GOOGLE_SEARCH_CX || '';
      console.log(`Google API Key starts with: ${apiKey.substring(0, 5)}... (length: ${apiKey.length})`);
      console.log(`Google Search CX starts with: ${cxId.substring(0, 5)}... (length: ${cxId.length})`);
      
      let results;
      
      if (rawResults) {
        // Just return the raw search results
        results = await searchAgent.searchOpportunities({
          query, 
          limit: 5
        });
        return res.json({
          success: true,
          query,
          resultsCount: results.length,
          hasCredentials: !!(apiKey && cxId),
          rawResults: results
        });
      } else {
        // Get AI-enhanced results
        results = await searchAgent.searchOpportunities({
          query, 
          limit: 5
        });
      }
      
      res.json({ 
        success: true, 
        query,
        resultsCount: results.length,
        hasCredentials: !!(apiKey && cxId),
        results 
      });
    } catch (error) {
      console.error("Error in test search:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        success: false, 
        message: "Failed to perform test search", 
        error: errorMessage 
      });
    }
  });
  
  // Public test page for Google Search API (for easy testing without login)
  app.get("/api/public-test", async (req, res) => {
    try {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dream University Navigator - Opportunity Search</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            form { margin-bottom: 20px; }
            input[type="text"] { width: 70%; padding: 8px; }
            button { padding: 8px 16px; background: #4a6cf7; color: white; border: none; border-radius: 4px; }
            .opportunity { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
            .opportunity h3 { margin-top: 0; color: #4a6cf7; }
            .link { margin-top: 10px; }
            .link a { color: #4a6cf7; text-decoration: none; }
            .link a:hover { text-decoration: underline; }
            .loading { text-align: center; padding: 40px; }
            .error { color: red; padding: 10px; background: #ffebee; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Dream University Navigator - Opportunity Search</h1>
          <p>Search for educational opportunities using the Google Search API</p>
          <form id="search-form">
            <input type="text" id="query" placeholder="Enter search query (e.g., high school research programs)" value="high school research programs" />
            <button type="submit">Search</button>
          </form>
          
          <div id="results"></div>
          
          <script>
            document.getElementById('search-form').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const query = document.getElementById('query').value;
              const resultsDiv = document.getElementById('results');
              
              resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
              
              try {
                const response = await fetch('/api/test-search?q=' + encodeURIComponent(query));
                const data = await response.json();
                
                if (!data.success) {
                  resultsDiv.innerHTML = '<div class="error">Error: ' + (data.message || 'Unknown error') + '</div>';
                  return;
                }
                
                // Display processed results
                if (data.results && data.results.length > 0) {
                  let html = '<h2>Opportunities Found (' + data.results.length + ')</h2>';
                  
                  data.results.forEach(opp => {
                    html += '<div class="opportunity">' +
                      '<h3>' + (opp.title || '') + '</h3>' +
                      '<p>' + (opp.description || opp.snippet || '') + '</p>' +
                      '<p><strong>Source:</strong> ' + (opp.source || opp.domain || '') + '</p>' +
                      '<div class="link"><a href="' + (opp.externalLink || opp.link || '#') + '" target="_blank">Visit Website</a></div>' +
                    '</div>';
                  });
                  
                  resultsDiv.innerHTML = html;
                } else {
                  resultsDiv.innerHTML = '<div class="error">No opportunities found</div>';
                }
              } catch (error) {
                resultsDiv.innerHTML = '<div class="error">Error: ' + error.message + '</div>';
              }
            });
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      res.status(500).send('An error occurred');
    }
  });

  // Authentication middleware helper
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Analyze compatibility with specific universities
  app.post("/api/ai/university-compatibility", isAuthenticated, async (req, res) => {
    try {
      const { universities } = req.body;
      
      if (!Array.isArray(universities) || universities.length === 0) {
        return res.status(400).json({ message: "Universities array is required" });
      }

      const userId = req.user!.id;
      const userProfile = await storage.getUserProfile(userId);

      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      const compatibility = await openAIAgent.analyzeUniversityCompatibility(
        userProfile, 
        universities
      );

      res.json({ compatibility });
    } catch (error) {
      console.error("Error analyzing university compatibility:", error);
      res.status(500).json({ message: "Failed to analyze university compatibility" });
    }
  });

  // Get feedback on the user's academic profile
  app.get("/api/ai/profile-feedback", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userProfile = await storage.getUserProfile(userId);

      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      const feedback = await openAIAgent.getProfileFeedback(userProfile);

      res.json({ feedback });
    } catch (error) {
      console.error("Error generating profile feedback:", error);
      res.status(500).json({ message: "Failed to generate profile feedback" });
    }
  });

  // Get AI-specific recommendations based on user profile
  app.get("/api/ai/recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userProfile = await storage.getUserProfile(userId);

      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }

      const focus = req.query.focus as string | undefined;
      
      const recommendations = await openAIAgent.getRecommendations({
        userProfile,
        specificFocus: focus
      });

      res.json({ recommendations });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Search for opportunities by query
  app.get("/api/search/opportunities", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      const category = req.query.category as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await searchAgent.searchOpportunities({
        query,
        category,
        limit
      });

      res.json({ results });
    } catch (error) {
      console.error("Error searching for opportunities:", error);
      res.status(500).json({ message: "Failed to search for opportunities" });
    }
  });

  // Search for opportunities by category
  app.get("/api/search/category/:category", isAuthenticated, async (req, res) => {
    try {
      const { category } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      const results = await searchAgent.searchByCategory(category, limit);

      res.json({ results });
    } catch (error) {
      console.error("Error searching by category:", error);
      res.status(500).json({ message: "Failed to search by category" });
    }
  });

  // Save an opportunity from search results
  app.post("/api/search/save", isAuthenticated, async (req, res) => {
    try {
      const { title, description, category, link, snippet, domain } = req.body;
      
      if (!title || !link) {
        return res.status(400).json({ message: "Title and link are required" });
      }
      
      // Create a new opportunity
      // Handle application deadline conversion for opportunities
      if (req.body && req.body.applicationDeadline && typeof req.body.applicationDeadline === 'string') {
        req.body.applicationDeadline = new Date(req.body.applicationDeadline);
      }
      
      const newOpportunity: InsertOpportunity = {
        title,
        description: snippet || "",
        category: category || "general",
        externalLink: link,
        source: domain,
        tags: [],
        isVerified: false,
        applicationDeadline: null,
        programDates: null,
        location: null,
        eligibility: null,
        cost: null,
        requirements: null,
        benefits: null,
        testimonials: null,
        applicationTimeline: null,
        imageIcon: null,
        admissionRate: null,
        universityImpact: null,
        impactRating: null
      };
      
      const opportunity = await storage.createOpportunity(newOpportunity);
      
      // Save it to the user's opportunities
      const userOpportunity = await storage.saveOpportunity({
        userId: req.user!.id,
        opportunityId: opportunity.id,
        isSaved: true,
        isApplied: false,
        isCompleted: false,
        notes: null
      });
      
      // Return the saved opportunity with full details
      res.status(201).json({
        ...userOpportunity,
        opportunity
      });
    } catch (error) {
      console.error("Error saving opportunity from search:", error);
      res.status(500).json({ message: "Failed to save opportunity" });
    }
  });

  // Create HTTP server - do not add catch-all routes here
  // The vite.ts file already handles serving the React app correctly
  const httpServer = createServer(app);

  return httpServer;
}
