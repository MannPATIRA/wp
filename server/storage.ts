import { users, userProfiles, opportunities, userOpportunities, notifications, timelineEvents } from "@shared/schema";
import type { User, InsertUser, UserProfile, InsertUserProfile, Opportunity, InsertOpportunity, UserOpportunity, InsertUserOpportunity, Notification, InsertNotification, TimelineEvent, InsertTimelineEvent } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Fix for express-session types
declare module 'express-session' {
  interface SessionStore {
    all: (callback: (err: any, sessions?: any) => void) => void;
    destroy: (sid: string, callback?: (err?: any) => void) => void;
    clear: (callback?: (err?: any) => void) => void;
    length: (callback: (err: any, length?: number) => void) => void;
    get: (sid: string, callback: (err: any, session?: session.SessionData | null) => void) => void;
    set: (sid: string, session: session.SessionData, callback?: (err?: any) => void) => void;
    touch: (sid: string, session: session.SessionData, callback?: (err?: any) => void) => void;
  }
}

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Profile operations
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  
  // Opportunity operations
  getOpportunity(id: number): Promise<Opportunity | undefined>;
  getOpportunities(limit?: number): Promise<Opportunity[]>;
  getOpportunitiesByCategory(category: string, limit?: number): Promise<Opportunity[]>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: number, opportunity: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  verifyOpportunity(id: number): Promise<Opportunity | undefined>;
  
  // User-Opportunity operations
  getUserOpportunities(userId: number): Promise<UserOpportunity[]>;
  saveOpportunity(userOpportunity: InsertUserOpportunity): Promise<UserOpportunity>;
  updateUserOpportunity(id: number, userOpportunity: Partial<InsertUserOpportunity>): Promise<UserOpportunity | undefined>;
  
  // Notification operations
  getNotifications(userId: number, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  
  // Timeline operations
  getTimelineEvents(userId: number): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(id: number, event: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined>;
  
  // Session store - using any type to avoid incompatible interface issues
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userProfiles: Map<number, UserProfile>;
  private opportunities: Map<number, Opportunity>;
  private userOpportunities: Map<number, UserOpportunity>;
  private notifications: Map<number, Notification>;
  private timelineEvents: Map<number, TimelineEvent>;
  
  sessionStore: any;
  
  private userIdCounter: number;
  private profileIdCounter: number;
  private opportunityIdCounter: number;
  private userOpportunityIdCounter: number;
  private notificationIdCounter: number;
  private timelineEventIdCounter: number;

  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
    this.opportunities = new Map();
    this.userOpportunities = new Map();
    this.notifications = new Map();
    this.timelineEvents = new Map();
    
    this.userIdCounter = 1;
    this.profileIdCounter = 1;
    this.opportunityIdCounter = 1;
    this.userOpportunityIdCounter = 1;
    this.notificationIdCounter = 1;
    this.timelineEventIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...userData, 
      id, 
      createdAt,
      age: userData.age ?? null,
      grade: userData.grade ?? null 
    };
    this.users.set(id, user);
    return user;
  }

  // Profile operations
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createUserProfile(profileData: InsertUserProfile): Promise<UserProfile> {
    const id = this.profileIdCounter++;
    const updatedAt = new Date();
    
    // Ensure arrays are properly typed
    let achievements: string[] | null = null;
    if (profileData.achievements) {
      achievements = Array.isArray(profileData.achievements) 
        ? [...profileData.achievements] 
        : [];
    }
    
    let extracurriculars: string[] | null = null;
    if (profileData.extracurriculars) {
      extracurriculars = Array.isArray(profileData.extracurriculars)
        ? [...profileData.extracurriculars]
        : [];
    }
    
    // Handle date conversion
    let applicationDeadline: Date | null = null;
    if (profileData.applicationDeadline) {
      applicationDeadline = new Date(profileData.applicationDeadline);
    }
    
    const profile: UserProfile = { 
      id, 
      userId: profileData.userId,
      updatedAt,
      gpa: profileData.gpa ?? null,
      sat: profileData.sat ?? null,
      act: profileData.act ?? null,
      apCourses: profileData.apCourses ?? null,
      targetUniversity: profileData.targetUniversity ?? null,
      targetMajor: profileData.targetMajor ?? null,
      achievements,
      extracurriculars,
      applicationDeadline
    };
    this.userProfiles.set(id, profile);
    return profile;
  }

  async updateUserProfile(userId: number, profileData: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const existingProfile = await this.getUserProfile(userId);
    if (!existingProfile) return undefined;
    
    // Handle array types properly
    let achievements = existingProfile.achievements;
    if (profileData.achievements !== undefined) {
      achievements = profileData.achievements ? 
        (Array.isArray(profileData.achievements) ? [...profileData.achievements] : []) : null;
    }
    
    let extracurriculars = existingProfile.extracurriculars;
    if (profileData.extracurriculars !== undefined) {
      extracurriculars = profileData.extracurriculars ? 
        (Array.isArray(profileData.extracurriculars) ? [...profileData.extracurriculars] : []) : null;
    }
    
    // Handle date conversion
    let applicationDeadline = existingProfile.applicationDeadline;
    if (profileData.applicationDeadline !== undefined) {
      applicationDeadline = profileData.applicationDeadline ? 
        new Date(profileData.applicationDeadline) : null;
    }
    
    // Create updated profile with properly handled types
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...profileData,
      achievements,
      extracurriculars,
      applicationDeadline,
      updatedAt: new Date()
    };
    
    this.userProfiles.set(existingProfile.id, updatedProfile);
    return updatedProfile;
  }

  // Opportunity operations
  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    return this.opportunities.get(id);
  }

  async getOpportunities(limit?: number): Promise<Opportunity[]> {
    const opportunities = Array.from(this.opportunities.values());
    return limit ? opportunities.slice(0, limit) : opportunities;
  }

  async getOpportunitiesByCategory(category: string, limit?: number): Promise<Opportunity[]> {
    const opportunities = Array.from(this.opportunities.values())
      .filter(opp => opp.category === category);
    return limit ? opportunities.slice(0, limit) : opportunities;
  }

  async createOpportunity(opportunityData: InsertOpportunity): Promise<Opportunity> {
    const id = this.opportunityIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    // Handle array types properly
    const tags: string[] | null = opportunityData.tags ? 
      (Array.isArray(opportunityData.tags) ? [...opportunityData.tags] : []) : null;
      
    const benefits: string[] | null = opportunityData.benefits ? 
      (Array.isArray(opportunityData.benefits) ? [...opportunityData.benefits] : []) : null;
      
    const requirements: string[] | null = opportunityData.requirements ? 
      (Array.isArray(opportunityData.requirements) ? [...opportunityData.requirements] : []) : null;
      
    const testimonials: {name: string, quote: string}[] | null = opportunityData.testimonials ? 
      (Array.isArray(opportunityData.testimonials) ? [...opportunityData.testimonials] : []) : null;
      
    const applicationTimeline: {date: string, event: string}[] | null = opportunityData.applicationTimeline ? 
      (Array.isArray(opportunityData.applicationTimeline) ? [...opportunityData.applicationTimeline] : []) : null;
    
    // Handle date conversion  
    const applicationDeadline: Date | null = opportunityData.applicationDeadline ? 
      new Date(opportunityData.applicationDeadline) : null;
    
    const opportunity: Opportunity = { 
      id, 
      createdAt, 
      updatedAt,
      // Required fields
      title: opportunityData.title,
      description: opportunityData.description,
      category: opportunityData.category,
      // Optional fields with proper type handling
      tags,
      applicationDeadline,
      programDates: opportunityData.programDates ?? null,
      location: opportunityData.location ?? null,
      cost: opportunityData.cost ?? null,
      eligibility: opportunityData.eligibility ?? null,
      admissionRate: opportunityData.admissionRate ?? null,
      benefits,
      requirements,
      testimonials,
      impactRating: opportunityData.impactRating ?? null,
      universityImpact: opportunityData.universityImpact ?? null,
      applicationTimeline,
      externalLink: opportunityData.externalLink ?? null,
      source: opportunityData.source ?? null,
      imageIcon: opportunityData.imageIcon ?? null,
      isVerified: opportunityData.isVerified ?? false
    };
    this.opportunities.set(id, opportunity);
    return opportunity;
  }

  async updateOpportunity(id: number, opportunityData: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const existingOpportunity = await this.getOpportunity(id);
    if (!existingOpportunity) return undefined;
    
    // Handle array types properly
    let tags = existingOpportunity.tags;
    if (opportunityData.tags !== undefined) {
      tags = opportunityData.tags ? 
        (Array.isArray(opportunityData.tags) ? [...opportunityData.tags] : []) : null;
    }
    
    let benefits = existingOpportunity.benefits;
    if (opportunityData.benefits !== undefined) {
      benefits = opportunityData.benefits ? 
        (Array.isArray(opportunityData.benefits) ? [...opportunityData.benefits] : []) : null;
    }
    
    let requirements = existingOpportunity.requirements;
    if (opportunityData.requirements !== undefined) {
      requirements = opportunityData.requirements ? 
        (Array.isArray(opportunityData.requirements) ? [...opportunityData.requirements] : []) : null;
    }
    
    let testimonials = existingOpportunity.testimonials;
    if (opportunityData.testimonials !== undefined) {
      testimonials = opportunityData.testimonials ? 
        (Array.isArray(opportunityData.testimonials) ? [...opportunityData.testimonials] : []) : null;
    }
    
    let applicationTimeline = existingOpportunity.applicationTimeline;
    if (opportunityData.applicationTimeline !== undefined) {
      applicationTimeline = opportunityData.applicationTimeline ? 
        (Array.isArray(opportunityData.applicationTimeline) ? [...opportunityData.applicationTimeline] : []) : null;
    }
    
    // Handle date conversion
    let applicationDeadline = existingOpportunity.applicationDeadline;
    if (opportunityData.applicationDeadline !== undefined) {
      applicationDeadline = opportunityData.applicationDeadline ? 
        new Date(opportunityData.applicationDeadline) : null;
    }
    
    // Create updated opportunity with properly handled types
    const updatedOpportunity: Opportunity = {
      ...existingOpportunity,
      ...opportunityData,
      tags,
      benefits,
      requirements,
      testimonials,
      applicationTimeline,
      applicationDeadline,
      updatedAt: new Date()
    };
    
    this.opportunities.set(id, updatedOpportunity);
    return updatedOpportunity;
  }

  async verifyOpportunity(id: number): Promise<Opportunity | undefined> {
    const existingOpportunity = await this.getOpportunity(id);
    if (!existingOpportunity) return undefined;

    const verifiedOpportunity: Opportunity = {
      ...existingOpportunity,
      isVerified: true,
      updatedAt: new Date()
    };
    
    this.opportunities.set(id, verifiedOpportunity);
    return verifiedOpportunity;
  }

  // User-Opportunity operations
  async getUserOpportunities(userId: number): Promise<UserOpportunity[]> {
    return Array.from(this.userOpportunities.values())
      .filter(userOpp => userOpp.userId === userId);
  }

  async saveOpportunity(userOpportunityData: InsertUserOpportunity): Promise<UserOpportunity> {
    const id = this.userOpportunityIdCounter++;
    const createdAt = new Date();
    const userOpportunity: UserOpportunity = { 
      ...userOpportunityData, 
      id, 
      createdAt,
      isSaved: userOpportunityData.isSaved ?? false,
      isApplied: userOpportunityData.isApplied ?? false,
      isCompleted: userOpportunityData.isCompleted ?? false,
      notes: userOpportunityData.notes ?? null
    };
    this.userOpportunities.set(id, userOpportunity);
    return userOpportunity;
  }

  async updateUserOpportunity(id: number, userOpportunityData: Partial<InsertUserOpportunity>): Promise<UserOpportunity | undefined> {
    const existingUserOpportunity = this.userOpportunities.get(id);
    if (!existingUserOpportunity) return undefined;

    const updatedUserOpportunity: UserOpportunity = {
      ...existingUserOpportunity,
      ...userOpportunityData
    };
    
    this.userOpportunities.set(id, updatedUserOpportunity);
    return updatedUserOpportunity;
  }

  // Notification operations
  async getNotifications(userId: number, limit?: number): Promise<Notification[]> {
    const notifications = Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return limit ? notifications.slice(0, limit) : notifications;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const createdAt = new Date();
    const notification: Notification = { 
      ...notificationData, 
      id, 
      createdAt,
      isRead: notificationData.isRead ?? false,
      relatedOpportunityId: notificationData.relatedOpportunityId ?? null
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updatedNotification: Notification = {
      ...notification,
      isRead: true
    };
    
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  // Timeline operations
  async getTimelineEvents(userId: number): Promise<TimelineEvent[]> {
    return Array.from(this.timelineEvents.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  }

  async createTimelineEvent(eventData: InsertTimelineEvent): Promise<TimelineEvent> {
    const id = this.timelineEventIdCounter++;
    const createdAt = new Date();
    // Convert string date to Date object
    const eventDate = typeof eventData.eventDate === 'string' 
      ? new Date(eventData.eventDate) 
      : eventData.eventDate;
    
    const event: TimelineEvent = { 
      ...eventData, 
      id, 
      createdAt,
      // Handle required fields
      eventDate,
      // Handle optional fields
      description: eventData.description ?? null,
      relatedOpportunityId: eventData.relatedOpportunityId ?? null,
      icon: eventData.icon ?? null
    };
    this.timelineEvents.set(id, event);
    return event;
  }

  async updateTimelineEvent(id: number, eventData: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const existingEvent = this.timelineEvents.get(id);
    if (!existingEvent) return undefined;
    
    // Handle eventDate conversion if it's a string
    let updatedEventDate = existingEvent.eventDate;
    if (eventData.eventDate !== undefined) {
      updatedEventDate = typeof eventData.eventDate === 'string' 
        ? new Date(eventData.eventDate) 
        : eventData.eventDate;
    }
    
    const updatedEvent: TimelineEvent = {
      ...existingEvent,
      ...eventData,
      // Ensure proper type handling
      eventDate: updatedEventDate,
      description: eventData.description !== undefined ? eventData.description : existingEvent.description,
      relatedOpportunityId: eventData.relatedOpportunityId !== undefined ? eventData.relatedOpportunityId : existingEvent.relatedOpportunityId,
      icon: eventData.icon !== undefined ? eventData.icon : existingEvent.icon
    };
    
    this.timelineEvents.set(id, updatedEvent);
    return updatedEvent;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    try {
      this.sessionStore = new PostgresSessionStore({ 
        pool, 
        tableName: 'session',
        createTableIfMissing: true,
        pruneSessionInterval: 60 // Clean up expired sessions every 60 seconds
      });
      console.log("PostgreSQL session store initialized successfully");
    } catch (error) {
      console.error("Failed to initialize PostgreSQL session store:", error);
      console.log("Falling back to memory session store");
      // Fallback to memory store if Postgres store fails
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // 24 hours
      });
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      username: userData.username,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      age: userData.age ?? null,
      grade: userData.grade ?? null
    }).returning();
    return user;
  }

  // Profile operations
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profileData: InsertUserProfile): Promise<UserProfile> {
    const profileValues: any = {
      userId: profileData.userId,
      gpa: profileData.gpa ?? null,
      sat: profileData.sat ?? null,
      act: profileData.act ?? null,
      apCourses: profileData.apCourses ?? null,
      targetUniversity: profileData.targetUniversity ?? null,
      targetMajor: profileData.targetMajor ?? null,
      achievements: profileData.achievements ?? null,
      extracurriculars: profileData.extracurriculars ?? null,
      // updatedAt must be a Date object for PostgreSQL timestamp column
      updatedAt: new Date(),
      // applicationDeadline also must be a Date object or null
      applicationDeadline: profileData.applicationDeadline ? new Date(profileData.applicationDeadline) : null
    };
    
    try {
      console.log("Creating user profile with data:", JSON.stringify(profileValues, null, 2));
      
      const [profile] = await db
        .insert(userProfiles)
        .values(profileValues)
        .returning();
      
      return profile;
    } catch (error) {
      console.error("Profile creation error:", error);
      throw error;
    }
  }

  async updateUserProfile(userId: number, profileData: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    
    if (!profile) return undefined;

    const updateData: any = { 
      ...profileData, 
      // updatedAt must be a Date object for PostgreSQL timestamp column
      updatedAt: new Date()
    };
    
    // Clean up any undefined values and convert date strings to Date objects
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        updateData[key] = null;
      }
      
      // If applicationDeadline is a string, convert to Date object for PostgreSQL
      if (key === 'applicationDeadline' && typeof updateData[key] === 'string' && updateData[key] !== null) {
        updateData[key] = new Date(updateData[key]);
      }
    });

    try {
      console.log("Updating profile with data:", JSON.stringify(updateData, null, 2));
      
      const [updatedProfile] = await db
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.id, profile.id))
        .returning();
      
      return updatedProfile;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  }

  // Opportunity operations
  async getOpportunity(id: number): Promise<Opportunity | undefined> {
    const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, id));
    return opportunity;
  }

  async getOpportunities(limit?: number): Promise<Opportunity[]> {
    let query = db.select().from(opportunities).orderBy(desc(opportunities.createdAt));
    
    if (limit !== undefined) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getOpportunitiesByCategory(category: string, limit?: number): Promise<Opportunity[]> {
    let query = db
      .select()
      .from(opportunities)
      .where(eq(opportunities.category, category))
      .orderBy(desc(opportunities.createdAt));
    
    if (limit !== undefined) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async createOpportunity(opportunityData: InsertOpportunity): Promise<Opportunity> {
    const cleanData: any = {};
    
    // Clean up any undefined values and normalize the structure
    Object.keys(opportunityData).forEach(key => {
      if (key === 'tags' || key === 'benefits' || key === 'requirements' || key === 'testimonials' || key === 'applicationTimeline') {
        cleanData[key] = opportunityData[key as keyof InsertOpportunity] ?? null;
      } else if (key === 'applicationDeadline' && typeof opportunityData.applicationDeadline === 'string' && opportunityData.applicationDeadline !== null) {
        // Convert string date to actual Date object for the database
        cleanData[key] = new Date(opportunityData.applicationDeadline);
      } else {
        cleanData[key] = opportunityData[key as keyof InsertOpportunity] === undefined ? null : opportunityData[key as keyof InsertOpportunity];
      }
    });

    try {
      console.log("Creating opportunity with data:", JSON.stringify(cleanData, null, 2));
      
      const [opportunity] = await db
        .insert(opportunities)
        .values(cleanData)
        .returning();
      
      return opportunity;
    } catch (error) {
      console.error("Opportunity creation error:", error);
      throw error;
    }
  }

  async updateOpportunity(id: number, opportunityData: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const updateData: any = { ...opportunityData, updatedAt: new Date() };
    
    // Clean up any undefined values and handle date strings
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        updateData[key] = null;
      }
      
      // If applicationDeadline is a string, convert to Date
      if (key === 'applicationDeadline' && typeof updateData[key] === 'string' && updateData[key] !== null) {
        updateData[key] = new Date(updateData[key]);
      }
    });

    try {
      console.log("Updating opportunity with data:", JSON.stringify(updateData, null, 2));
      
      const [updatedOpportunity] = await db
        .update(opportunities)
        .set(updateData)
        .where(eq(opportunities.id, id))
        .returning();
      
      return updatedOpportunity;
    } catch (error) {
      console.error("Opportunity update error:", error);
      throw error;
    }
  }

  async verifyOpportunity(id: number): Promise<Opportunity | undefined> {
    const [verifiedOpportunity] = await db
      .update(opportunities)
      .set({ isVerified: true, updatedAt: new Date() })
      .where(eq(opportunities.id, id))
      .returning();
    
    return verifiedOpportunity;
  }

  // User-Opportunity operations
  async getUserOpportunities(userId: number): Promise<UserOpportunity[]> {
    return await db
      .select()
      .from(userOpportunities)
      .where(eq(userOpportunities.userId, userId));
  }

  async saveOpportunity(userOpportunityData: InsertUserOpportunity): Promise<UserOpportunity> {
    const [userOpportunity] = await db
      .insert(userOpportunities)
      .values({
        userId: userOpportunityData.userId,
        opportunityId: userOpportunityData.opportunityId,
        isSaved: userOpportunityData.isSaved ?? null,
        isApplied: userOpportunityData.isApplied ?? null,
        isCompleted: userOpportunityData.isCompleted ?? null,
        notes: userOpportunityData.notes ?? null
      })
      .returning();
    
    return userOpportunity;
  }

  async updateUserOpportunity(id: number, userOpportunityData: Partial<InsertUserOpportunity>): Promise<UserOpportunity | undefined> {
    const updateData: any = { ...userOpportunityData };
    
    // Clean up any undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        updateData[key] = null;
      }
    });

    const [updatedUserOpportunity] = await db
      .update(userOpportunities)
      .set(updateData)
      .where(eq(userOpportunities.id, id))
      .returning();
    
    return updatedUserOpportunity;
  }

  // Notification operations
  async getNotifications(userId: number, limit?: number): Promise<Notification[]> {
    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    if (limit !== undefined) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        isRead: notificationData.isRead ?? false,
        relatedOpportunityId: notificationData.relatedOpportunityId ?? null
      })
      .returning();
    
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    
    return updatedNotification;
  }

  // Timeline operations
  async getTimelineEvents(userId: number): Promise<TimelineEvent[]> {
    return await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.userId, userId))
      .orderBy(asc(timelineEvents.eventDate));
  }

  async createTimelineEvent(eventData: InsertTimelineEvent): Promise<TimelineEvent> {
    const eventValues: any = {
      userId: eventData.userId,
      title: eventData.title,
      description: eventData.description ?? null,
      type: eventData.type,
      icon: eventData.icon ?? null,
      relatedOpportunityId: eventData.relatedOpportunityId ?? null,
      // Convert eventDate to Date object for PostgreSQL 
      eventDate: eventData.eventDate ? new Date(eventData.eventDate) : null
    };
    
    try {
      console.log("Creating timeline event with data:", JSON.stringify(eventValues, null, 2));
      
      const [event] = await db
        .insert(timelineEvents)
        .values(eventValues)
        .returning();
      
      return event;
    } catch (error) {
      console.error("Timeline event creation error:", error);
      throw error;
    }
  }

  async updateTimelineEvent(id: number, eventData: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const updateData: any = { ...eventData };
    
    // Clean up any undefined values and convert date strings to Date objects
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        updateData[key] = null;
      }
      
      // If eventDate is a string, convert to Date object for PostgreSQL
      if (key === 'eventDate' && typeof updateData[key] === 'string' && updateData[key] !== null) {
        updateData[key] = new Date(updateData[key]);
      }
    });

    try {
      console.log("Updating timeline event with data:", JSON.stringify(updateData, null, 2));
      
      const [updatedEvent] = await db
        .update(timelineEvents)
        .set(updateData)
        .where(eq(timelineEvents.id, id))
        .returning();
      
      return updatedEvent;
    } catch (error) {
      console.error("Timeline event update error:", error);
      throw error;
    }
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();
