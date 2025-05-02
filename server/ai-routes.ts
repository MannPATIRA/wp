import { Express, Request, Response } from "express";
import { openAIAgent } from "./agents/openai-agent";
import { searchAgent } from "./agents/search-agent";
import { storage } from "./storage";
import { InsertOpportunity } from "@shared/schema";
import { recommendationAgent } from "./agents/recommendation-agent";

export function registerAIRoutes(app: Express) {
  // Middleware to check if the user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // TEST ENDPOINT: Search with Google Custom Search API (no auth required)
  app.get("/api/test-search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      console.log("Testing Google Search with query:", query);
      console.log("Google API Key starts with:", process.env.GOOGLE_API_KEY?.substring(0, 5) + "..." + ` (length: ${process.env.GOOGLE_API_KEY?.length || 0})`);
      console.log("Google Search CX starts with:", process.env.GOOGLE_SEARCH_CX?.substring(0, 5) + "..." + ` (length: ${process.env.GOOGLE_SEARCH_CX?.length || 0})`);
      
      const hasCredentials = !!process.env.GOOGLE_API_KEY && !!process.env.GOOGLE_SEARCH_CX;
      
      if (!hasCredentials) {
        return res.status(500).json({
          success: false,
          error: "Google Search API credentials are not configured"
        });
      }
      
      const results = await searchAgent.searchOpportunities({
        query,
        limit: 5
      });
      
      res.json({
        success: true,
        query,
        resultsCount: results.length,
        hasCredentials,
        results
      });
    } catch (error) {
      console.error("Error in test search endpoint:", error);
      res.status(500).json({
        success: false,
        error: `${error}`
      });
    }
  });
  
  // Replace default recommendations with web searched recommendations
  app.get("/api/opportunities/recommendations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      const profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ error: "User profile not found" });
      }
      
      console.log("Getting recommendations for user profile with university:", profile.targetUniversity, "and major:", profile.targetMajor);
      
      // Use the recommendation agent to get personalized recommendations
      const recommendations = await recommendationAgent.getRecommendations(user!, profile);
      
      res.json({
        success: true,
        count: recommendations.length,
        recommendations
      });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get recommendations"
      });
    }
  });

  // Get personalized recommendations based on user profile
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
}