import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  age: integer("age"),
  grade: text("grade"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gpa: text("gpa"),
  sat: integer("sat"),
  act: integer("act"),
  apCourses: integer("ap_courses"),
  targetUniversity: text("target_university"),
  targetMajor: text("target_major"),
  applicationDeadline: timestamp("application_deadline"),
  achievements: jsonb("achievements").$type<string[]>(),
  extracurriculars: jsonb("extracurriculars").$type<string[]>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  tags: jsonb("tags").$type<string[]>(),
  applicationDeadline: timestamp("application_deadline"),
  programDates: text("program_dates"),
  location: text("location"),
  cost: text("cost"),
  eligibility: text("eligibility"),
  admissionRate: text("admission_rate"),
  benefits: jsonb("benefits").$type<string[]>(),
  requirements: jsonb("requirements").$type<string[]>(),
  testimonials: jsonb("testimonials").$type<{name: string, quote: string}[]>(),
  impactRating: integer("impact_rating"), // 1-5
  universityImpact: text("university_impact"),
  applicationTimeline: jsonb("application_timeline").$type<{date: string, event: string}[]>(),
  externalLink: text("external_link"),
  source: text("source"), // Source domain or organization
  imageIcon: text("image_icon"), // material icon name
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userOpportunities = pgTable("user_opportunities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  opportunityId: integer("opportunity_id").notNull().references(() => opportunities.id),
  isSaved: boolean("is_saved").default(false),
  isApplied: boolean("is_applied").default(false),
  isCompleted: boolean("is_completed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // notification, calendar, deadline, etc.
  isRead: boolean("is_read").default(false),
  relatedOpportunityId: integer("related_opportunity_id").references(() => opportunities.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date").notNull(),
  type: text("type").notNull(), // deadline, application, test, visit, etc.
  icon: text("icon"), // material icon name
  relatedOpportunityId: integer("related_opportunity_id").references(() => opportunities.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// Create UserProfile schema with special handling for date fields
export const insertUserProfileSchema = createInsertSchema(userProfiles)
  .omit({ id: true, updatedAt: true })
  .extend({
    // Accept string or Date for applicationDeadline, but keep it as a string when submitted from client
    applicationDeadline: z.union([
      z.string().nullable(),
      z.instanceof(Date).nullable()
    ]).nullable().optional()
      .transform(val => {
        if (!val) return null;
        // If it's already a Date, convert to YYYY-MM-DD string format
        if (val instanceof Date) {
          return val.toISOString().split('T')[0];
        }
        // If it's a string, keep it as is (should be in YYYY-MM-DD format from the date picker)
        return val;
      }),
  });

export const insertOpportunitySchema = createInsertSchema(opportunities)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    // Accept string or Date for applicationDeadline, but keep it as a string when submitted from client
    applicationDeadline: z.union([
      z.string().nullable(), 
      z.instanceof(Date).nullable()
    ]).nullable().optional()
      .transform(val => {
        if (!val) return null;
        // If it's already a Date, convert to YYYY-MM-DD string format
        if (val instanceof Date) {
          return val.toISOString().split('T')[0];
        }
        // If it's a string, keep it as is (should be in YYYY-MM-DD format from the date picker)
        return val;
      }),
  });

export const insertUserOpportunitySchema = createInsertSchema(userOpportunities).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });

// Create TimelineEvent schema with special handling for date fields
export const insertTimelineEventSchema = createInsertSchema(timelineEvents)
  .omit({ id: true, createdAt: true })
  .extend({
    // Accept either string or Date for eventDate, but keep as string for consistency
    eventDate: z.union([
      z.string(),
      z.instanceof(Date)
    ])
      .transform(val => {
        // If it's already a Date, convert to YYYY-MM-DD string format
        if (val instanceof Date) {
          return val.toISOString().split('T')[0];
        }
        // If it's a string, keep it as is (should be in YYYY-MM-DD format from the date picker)
        return val;
      }),
  });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;

export type UserOpportunity = typeof userOpportunities.$inferSelect;
export type InsertUserOpportunity = z.infer<typeof insertUserOpportunitySchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
