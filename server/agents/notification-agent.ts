import { storage } from "../storage";
import { InsertNotification, User } from "@shared/schema";

/**
 * Notification Agent
 * 
 * Handles in-app notifications when new opportunities are found.
 */
export class NotificationAgent {
  /**
   * Create a notification for a user
   * @param userId User ID
   * @param title Notification title
   * @param message Notification message
   * @param type Notification type
   * @param relatedOpportunityId Optional related opportunity ID
   * @returns Created notification
   */
  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: string,
    relatedOpportunityId?: number
  ) {
    const notification: InsertNotification = {
      userId,
      title,
      message,
      type,
      isRead: false,
      relatedOpportunityId
    };
    
    return await storage.createNotification(notification);
  }
  
  /**
   * Notify a user about a new opportunity
   * @param user User to notify
   * @param opportunityId Opportunity ID
   * @param opportunityTitle Opportunity title
   * @returns Created notification
   */
  async notifyNewOpportunity(user: User, opportunityId: number, opportunityTitle: string) {
    return this.createNotification(
      user.id,
      "New Opportunity",
      `A new opportunity has been found: ${opportunityTitle}`,
      "opportunity",
      opportunityId
    );
  }
  
  /**
   * Notify a user about an upcoming application deadline
   * @param user User to notify
   * @param opportunityId Opportunity ID
   * @param opportunityTitle Opportunity title
   * @param deadline Application deadline
   * @returns Created notification
   */
  async notifyApplicationDeadline(user: User, opportunityId: number, opportunityTitle: string, deadline: Date) {
    const daysUntilDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    let message = "";
    if (daysUntilDeadline <= 0) {
      message = `Today is the deadline for ${opportunityTitle}!`;
    } else if (daysUntilDeadline === 1) {
      message = `Tomorrow is the deadline for ${opportunityTitle}!`;
    } else {
      message = `${opportunityTitle} deadline is in ${daysUntilDeadline} days.`;
    }
    
    return this.createNotification(
      user.id,
      "Application Deadline",
      message,
      "deadline",
      opportunityId
    );
  }
  
  /**
   * Notify a user about a new recommendation
   * @param user User to notify
   * @param count Number of recommendations
   * @returns Created notification
   */
  async notifyNewRecommendations(user: User, count: number) {
    return this.createNotification(
      user.id,
      "New Recommendations",
      `We found ${count} new activities that match your profile!`,
      "recommendation"
    );
  }
  
  /**
   * Get unread notifications for a user
   * @param userId User ID
   * @returns Unread notifications
   */
  async getUnreadNotifications(userId: number) {
    const notifications = await storage.getNotifications(userId);
    return notifications.filter(notification => !notification.isRead);
  }
  
  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   * @returns Updated notification
   */
  async markAsRead(notificationId: number) {
    return storage.markNotificationAsRead(notificationId);
  }
  
  /**
   * Check for upcoming deadlines and send notifications
   * This would typically be run by a scheduled job
   */
  async checkUpcomingDeadlines() {
    const users = Array.from((storage as any).users.values());
    const opportunities = await storage.getOpportunities();
    
    const today = new Date();
    const deadlineThresholds = [1, 3, 7, 14]; // days before deadline
    
    for (const user of users) {
      for (const opportunity of opportunities) {
        if (opportunity.applicationDeadline) {
          const deadline = new Date(opportunity.applicationDeadline);
          const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (deadlineThresholds.includes(daysUntilDeadline)) {
            await this.notifyApplicationDeadline(
              user,
              opportunity.id,
              opportunity.title,
              deadline
            );
          }
        }
      }
    }
  }
}
