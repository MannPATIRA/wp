import { InsertOpportunity } from "@shared/schema";

interface ValidationResult {
  isValid: boolean;
  opportunity: InsertOpportunity;
  issues?: string[];
}

/**
 * Opportunity Validation Agent
 * 
 * Verifies that each identified opportunity is currently active and suitable
 * for high school students.
 */
export class OpportunityValidationAgent {
  /**
   * Validate an opportunity to ensure it's appropriate for high school students
   * @param opportunity Opportunity to validate
   * @returns Validation result with validated opportunity
   */
  async validateOpportunity(opportunity: InsertOpportunity): Promise<ValidationResult> {
    const issues: string[] = [];
    
    // Check required fields
    if (!opportunity.title || !opportunity.description || !opportunity.category) {
      issues.push("Missing required fields");
      return { 
        isValid: false, 
        opportunity,
        issues
      };
    }
    
    // Validate opportunity is for high school students
    if (opportunity.eligibility && !this.isForHighSchoolStudents(opportunity.eligibility)) {
      issues.push("Not suitable for high school students");
      return { 
        isValid: false, 
        opportunity,
        issues
      };
    }
    
    // Validate application deadline hasn't passed
    if (opportunity.applicationDeadline) {
      const deadline = new Date(opportunity.applicationDeadline);
      const today = new Date();
      
      if (deadline < today) {
        issues.push("Application deadline has passed");
        return {
          isValid: false,
          opportunity,
          issues
        };
      }
    }
    
    // Ensure opportunity has a category
    const validCategories = ["Academic", "Leadership", "Community", "Research"];
    if (!validCategories.includes(opportunity.category)) {
      opportunity.category = this.determineCategory(opportunity);
    }
    
    // Ensure opportunity has an impact rating
    if (!opportunity.impactRating || opportunity.impactRating < 1 || opportunity.impactRating > 5) {
      opportunity.impactRating = this.calculateImpactRating(opportunity);
    }
    
    // Ensure opportunity has an icon
    if (!opportunity.imageIcon) {
      opportunity.imageIcon = this.assignIcon(opportunity.category);
    }
    
    // Set isVerified to true since we've validated it
    const validatedOpportunity = {
      ...opportunity,
      isVerified: true
    };
    
    return {
      isValid: true,
      opportunity: validatedOpportunity
    };
  }
  
  /**
   * Check if the opportunity is suitable for high school students
   */
  private isForHighSchoolStudents(eligibility: string): boolean {
    const keywords = [
      "high school", 
      "highschool", 
      "grade 9", 
      "grade 10", 
      "grade 11", 
      "grade 12",
      "9th grade",
      "10th grade",
      "11th grade",
      "12th grade",
      "secondary school",
      "teenager",
      "teen",
      "young adult",
      "K-12"
    ];
    
    const lowerEligibility = eligibility.toLowerCase();
    return keywords.some(keyword => lowerEligibility.includes(keyword));
  }
  
  /**
   * Determine category based on opportunity content
   */
  private determineCategory(opportunity: InsertOpportunity): string {
    const content = `${opportunity.title} ${opportunity.description} ${opportunity.tags?.join(' ') || ''}`.toLowerCase();
    
    const categoryKeywords = {
      "Academic": ["academic", "course", "class", "learning", "study", "education", "school", "competition", "olympiad", "tournament", "challenge"],
      "Leadership": ["leadership", "president", "captain", "director", "officer", "chair", "executive", "student government", "council", "lead", "manage", "organize"],
      "Community": ["community", "service", "volunteer", "nonprofit", "charity", "social", "help", "assist", "support", "outreach", "mentor"],
      "Research": ["research", "lab", "science", "investigation", "study", "experiment", "analyze", "data", "findings", "discover", "innovation"]
    };
    
    // Find which category has the most keyword matches
    let bestCategory = "Academic"; // Default
    let maxMatches = 0;
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(keyword => content.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = category;
      }
    }
    
    return bestCategory;
  }
  
  /**
   * Calculate impact rating (1-5) for the opportunity
   */
  private calculateImpactRating(opportunity: InsertOpportunity): number {
    // Default medium impact
    let score = 3;
    
    // Factors that increase impact
    const highImpactKeywords = [
      "prestigious", "selective", "competitive", "ivy league", "international", 
      "national", "award-winning", "recognition", "scholarship", "elite"
    ];
    
    const content = `${opportunity.title} ${opportunity.description} ${opportunity.universityImpact || ''}`.toLowerCase();
    
    // Count how many high impact keywords are present
    const matches = highImpactKeywords.filter(keyword => content.includes(keyword)).length;
    
    // Adjust score based on matches
    if (matches >= 3) {
      score = 5; // Very high impact
    } else if (matches >= 1) {
      score = 4; // High impact
    }
    
    // Adjust based on admission rate if available
    if (opportunity.admissionRate) {
      const rate = opportunity.admissionRate.toLowerCase();
      if (rate.includes("less than 10%") || rate.includes("<10%") || rate.includes("under 10%")) {
        score = Math.max(score, 5);
      } else if (rate.includes("less than 20%") || rate.includes("<20%") || rate.includes("under 20%")) {
        score = Math.max(score, 4);
      }
    }
    
    return score;
  }
  
  /**
   * Assign an appropriate material icon based on category
   */
  private assignIcon(category: string): string {
    const categoryIcons: Record<string, string> = {
      "Academic": "school",
      "Leadership": "groups",
      "Community": "volunteer_activism",
      "Research": "science"
    };
    
    return categoryIcons[category] || "event";
  }
}
