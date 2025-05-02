import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { ProfileSummaryCard } from "@/components/dashboard/profile-summary-card";
import { UniversityReadiness } from "@/components/dashboard/university-readiness";
import { NotificationPanel } from "@/components/dashboard/notification-panel";
import { TimelinePreview } from "@/components/dashboard/timeline-preview";
import { RecommendedActivities } from "@/components/dashboard/recommended-activities";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { UserProfile, Notification, TimelineEvent, Opportunity } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    // Will use the default queryFn from queryClient.ts
  });

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    // Will use the default queryFn from queryClient.ts
  });

  // Fetch timeline events
  const { data: timelineEvents, isLoading: timelineLoading } = useQuery<TimelineEvent[]>({
    queryKey: ["/api/timeline"],
    // Will use the default queryFn from queryClient.ts
  });

  // Fetch recommendations
  const { 
    data: recommendations, 
    isLoading: recommendationsLoading, 
    error: recommendationsError 
  } = useQuery<Opportunity[]>({
    queryKey: ["/api/recommendations"],
    // Will use the default queryFn from queryClient.ts
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000,
    gcTime: 0, // Don't cache stale data
    meta: {
      errorMessage: "Failed to load recommendations" 
    }
  });
  
  // React Query v5 doesn't support onSuccess/onError in the useQuery options,
  // so we need to use React effects to handle these scenarios
  useEffect(() => {
    if (recommendations && !recommendationsLoading) {
      console.log("✅ Recommendations loaded successfully!");
      console.log("Recommendations count:", recommendations.length);
      console.log("First recommendation:", recommendations[0]);
    }
  }, [recommendations, recommendationsLoading]);
  
  useEffect(() => {
    if (recommendationsError) {
      console.error("❌ Recommendations API error:", recommendationsError);
      console.error("Error message:", recommendationsError instanceof Error ? recommendationsError.message : String(recommendationsError));
      if (recommendationsError instanceof Error && 'stack' in recommendationsError) {
        console.error("Error stack:", recommendationsError.stack);
      }
    }
  }, [recommendationsError]);
  
  // Enhanced logging for recommendation data debugging
  console.log("Dashboard - Recommendations data type:", recommendations ? typeof recommendations : 'null/undefined');
  console.log("Dashboard - Is recommendations an array?", Array.isArray(recommendations));
  console.log("Dashboard - Recommendations data:", recommendations);
  console.log("Dashboard - Recommendations loading:", recommendationsLoading);
  console.log("Dashboard - Recommendations error:", recommendationsError);

  const isLoading = profileLoading || notificationsLoading || timelineLoading || recommendationsLoading;

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar for desktop */}
      <Sidebar />
      
      {/* Mobile menu and content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile menu */}
        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)}
          onOpen={() => setIsMobileMenuOpen(true)}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 font-poppins">Dashboard</h1>
                  <p className="mt-1 text-sm text-neutral-600">
                    Welcome back, {user?.firstName}! Here's your university preparation progress.
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                    <span className="material-icons text-sm mr-1">stars</span>
                    Gold Status
                  </span>
                </div>
              </header>

              {/* User Profile Summary Card */}
              <ProfileSummaryCard profile={profile} user={user} />

              {/* University Readiness Progress */}
              <UniversityReadiness profile={profile} />

              {/* Upcoming Deadlines & Notifications */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notification Panel */}
                <NotificationPanel notifications={notifications || []} className="lg:col-span-2" />
                
                {/* Timeline/Calendar Preview */}
                <TimelinePreview events={timelineEvents || []} />
              </div>

              {/* Recommended Extracurricular Activities */}
              <RecommendedActivities recommendations={recommendations || []} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
