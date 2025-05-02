import { InputAgent } from "./input-agent";
import { RecommendationAgent } from "./recommendation-agent";
import { ScraperAgent } from "./scraper-agent";
import { OpportunityValidationAgent } from "./opportunity-validation-agent";
import { NotificationAgent } from "./notification-agent";
import { TestingAgent } from "./testing-agent";

// Initialize the agents
export const inputAgent = new InputAgent();
export const recommendationAgent = new RecommendationAgent();
export const scraperAgent = new ScraperAgent();
export const opportunityValidationAgent = new OpportunityValidationAgent();
export const notificationAgent = new NotificationAgent();
export const testingAgent = new TestingAgent();

// Export the agent classes
export { InputAgent } from "./input-agent";
export { RecommendationAgent } from "./recommendation-agent";
export { ScraperAgent } from "./scraper-agent";
export { OpportunityValidationAgent } from "./opportunity-validation-agent";
export { NotificationAgent } from "./notification-agent";
export { TestingAgent } from "./testing-agent";
