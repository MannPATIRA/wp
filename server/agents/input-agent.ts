import { InsertUserProfile } from "@shared/schema";

/**
 * Input Agent
 * 
 * Responsible for collecting and validating user input.
 */
export class InputAgent {
  /**
   * Validates user profile input 
   * @param profileData User profile data to validate
   * @returns Validated profile data
   */
  async validateInput(profileData: InsertUserProfile): Promise<InsertUserProfile> {
    // Clean up input
    const cleanedData = this.cleanInput(profileData);
    
    // Validate academic data
    if (cleanedData.gpa) {
      cleanedData.gpa = this.validateGPA(cleanedData.gpa);
    }
    
    if (cleanedData.sat && (cleanedData.sat < 400 || cleanedData.sat > 1600)) {
      throw new Error("SAT score must be between 400 and 1600");
    }
    
    if (cleanedData.act && (cleanedData.act < 1 || cleanedData.act > 36)) {
      throw new Error("ACT score must be between 1 and 36");
    }
    
    if (cleanedData.apCourses && cleanedData.apCourses < 0) {
      throw new Error("AP Courses cannot be negative");
    }
    
    return cleanedData;
  }
  
  /**
   * Clean user input by removing extra whitespace and normalizing values
   */
  private cleanInput(data: InsertUserProfile): InsertUserProfile {
    const cleaned = { ...data };
    
    // Trim string fields
    if (cleaned.gpa) cleaned.gpa = cleaned.gpa.trim();
    if (cleaned.targetUniversity) cleaned.targetUniversity = cleaned.targetUniversity.trim();
    if (cleaned.targetMajor) cleaned.targetMajor = cleaned.targetMajor.trim();
    
    // Convert array fields from undefined to empty array if needed
    if (!cleaned.achievements) cleaned.achievements = [];
    if (!cleaned.extracurriculars) cleaned.extracurriculars = [];
    
    // Filter out empty strings in arrays
    if (cleaned.achievements) {
      cleaned.achievements = cleaned.achievements.filter(a => a.trim() !== '');
    }
    
    if (cleaned.extracurriculars) {
      cleaned.extracurriculars = cleaned.extracurriculars.filter(e => e.trim() !== '');
    }
    
    return cleaned;
  }
  
  /**
   * Validates GPA format and ensures it's within a valid range
   */
  private validateGPA(gpa: string): string {
    // Handle different GPA formats (4.0, 4.0/4.0, etc.)
    if (gpa.includes('/')) {
      const [value, scale] = gpa.split('/');
      const numValue = parseFloat(value);
      const numScale = parseFloat(scale);
      
      if (isNaN(numValue) || isNaN(numScale)) {
        throw new Error("Invalid GPA format");
      }
      
      if (numValue > numScale) {
        throw new Error("GPA value cannot be greater than scale");
      }
      
      return `${numValue}/${numScale}`;
    } else {
      const numValue = parseFloat(gpa);
      
      if (isNaN(numValue)) {
        throw new Error("Invalid GPA format");
      }
      
      // Assume 4.0 scale if not specified
      if (numValue > 4.0) {
        throw new Error("GPA cannot be greater than 4.0 on standard scale");
      }
      
      return gpa;
    }
  }
}
