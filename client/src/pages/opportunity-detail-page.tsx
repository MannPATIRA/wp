import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Opportunity, InsertUserOpportunity } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { OpportunityDetail } from "@/components/opportunity/opportunity-detail";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function OpportunityDetailPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch opportunity details
  const { data: opportunity, isLoading } = useQuery<Opportunity>({
    queryKey: [`/api/opportunities/${id}`],
    // Will use the default queryFn from queryClient.ts
  });

  // Fetch user's interaction with this opportunity (saved, applied, etc.)
  const { data: userOpportunity } = useQuery<any>({
    queryKey: ["/api/user/opportunities"],
    select: (data) => data?.find((item: any) => item.opportunityId === Number(id)),
  });

  const saveOpportunity = async (isSaved: boolean) => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save opportunities",
          variant: "destructive",
        });
        return;
      }

      if (userOpportunity) {
        // Update existing userOpportunity
        await apiRequest("PATCH", `/api/user/opportunities/${userOpportunity.id}`, {
          isSaved,
        });
      } else {
        // Create new userOpportunity
        const newUserOpportunity: InsertUserOpportunity = {
          userId: user.id,
          opportunityId: Number(id),
          isSaved,
          isApplied: false,
          isCompleted: false,
        };
        await apiRequest("POST", "/api/user/opportunities", newUserOpportunity);
      }
      
      // Invalidate user opportunities cache
      queryClient.invalidateQueries({ queryKey: ["/api/user/opportunities"] });
      
      toast({
        title: isSaved ? "Opportunity saved" : "Opportunity unsaved",
        description: isSaved 
          ? "The opportunity has been added to your saved list" 
          : "The opportunity has been removed from your saved list",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error saving the opportunity",
        variant: "destructive",
      });
    }
  };

  const applyForOpportunity = async () => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to apply for opportunities",
          variant: "destructive",
        });
        return;
      }

      if (userOpportunity) {
        // Update existing userOpportunity
        await apiRequest("PATCH", `/api/user/opportunities/${userOpportunity.id}`, {
          isApplied: true,
        });
      } else {
        // Create new userOpportunity
        const newUserOpportunity: InsertUserOpportunity = {
          userId: user.id,
          opportunityId: Number(id),
          isSaved: true,
          isApplied: true,
          isCompleted: false,
        };
        await apiRequest("POST", "/api/user/opportunities", newUserOpportunity);
      }
      
      // Invalidate user opportunities cache
      queryClient.invalidateQueries({ queryKey: ["/api/user/opportunities"] });
      
      toast({
        title: "Application started",
        description: "The opportunity has been marked as applied",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error applying for the opportunity",
        variant: "destructive",
      });
    }
  };

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
          <div className="flex items-center mb-4">
            <Link href="/opportunities">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-neutral-900 font-poppins">Opportunity Details</h1>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : opportunity ? (
            <OpportunityDetail 
              opportunity={opportunity} 
              userOpportunity={userOpportunity} 
              onSave={saveOpportunity} 
              onApply={applyForOpportunity} 
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 p-6 bg-white rounded-lg shadow-sm border border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">Opportunity not found</h2>
              <p className="text-neutral-600 mb-4">The opportunity you're looking for doesn't exist or has been removed.</p>
              <Link href="/opportunities">
                <Button className="mt-2">Browse Opportunities</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
