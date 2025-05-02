import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Opportunity } from "@shared/schema";
import { Link } from "wouter";
import { Calendar, Bookmark, BookmarkCheck, ArrowRight } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface OpportunityCardProps {
  opportunity: Opportunity;
  isSaved?: boolean;
}

export function OpportunityCard({ opportunity, isSaved = false }: OpportunityCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Get color class based on category
  const getCategoryColorClass = (category: string) => {
    switch (category) {
      case "Academic":
        return "bg-primary-100 text-primary-800";
      case "Leadership":
        return "bg-secondary-100 text-secondary-800";
      case "Community":
        return "bg-amber-100 text-amber-800";
      case "Research":
        return "bg-green-100 text-green-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  // Get icon color class based on category
  const getIconColorClass = (category: string) => {
    switch (category) {
      case "Academic":
        return "bg-primary-100 text-primary-700";
      case "Leadership":
        return "bg-secondary-100 text-secondary-700";
      case "Community":
        return "bg-amber-100 text-amber-700";
      case "Research":
        return "bg-green-100 text-green-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  // Get icon based on material icon name
  const getIconComponent = (iconName: string) => {
    // Use basic svg icons that match material icons
    switch (iconName) {
      case "science":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2v7.31M14 9.3V2M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
            <path d="M5.58 16.5h12.85" />
          </svg>
        );
      case "groups":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "volunteer_activism":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 14.25v-4.5L12 12l3-2.25v4.5" />
          </svg>
        );
    }
  };

  // Toggle saved status mutation
  const toggleSaveMutation = useMutation({
    mutationFn: async (shouldSave: boolean) => {
      if (!user) {
        throw new Error("You must be logged in to save opportunities");
      }
      
      // Check if we have an existing relationship with this opportunity
      const userOpportunitiesRes = await apiRequest("GET", "/api/user/opportunities");
      const userOpportunities = await userOpportunitiesRes.json();
      
      const existingRelationship = userOpportunities.find(
        (uo: any) => uo.opportunityId === opportunity.id
      );
      
      if (existingRelationship) {
        // Update existing relationship
        return apiRequest("PATCH", `/api/user/opportunities/${existingRelationship.id}`, {
          isSaved: shouldSave,
        });
      } else {
        // Create new relationship
        return apiRequest("POST", "/api/user/opportunities", {
          opportunityId: opportunity.id,
          isSaved: shouldSave,
          isApplied: false,
          isCompleted: false,
        });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/opportunities"] });
      toast({
        title: variables ? "Opportunity saved" : "Opportunity removed",
        description: variables 
          ? "The opportunity has been added to your saved list" 
          : "The opportunity has been removed from your saved list",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "There was an error updating your saved opportunities",
        variant: "destructive",
      });
    },
  });

  // Handle bookmark click
  const handleBookmarkClick = () => {
    toggleSaveMutation.mutate(!isSaved);
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-neutral-200 transition-all hover:shadow-md hover:-translate-y-1">
      <div className={`h-32 ${getIconColorClass(opportunity.category)} rounded-t-lg flex items-center justify-center`}>
        {getIconComponent(opportunity.imageIcon || "")}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge className={getCategoryColorClass(opportunity.category)}>{opportunity.category}</Badge>
          {(opportunity.impactRating ?? 0) >= 4 && (
            <span className="text-xs text-neutral-600">High Impact</span>
          )}
        </div>
        <h3 className="font-medium text-neutral-900">{opportunity.title}</h3>
        <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{opportunity.description}</p>
        {opportunity.applicationDeadline && (
          <div className="mt-3 flex items-center text-xs text-neutral-600">
            <Calendar className="mr-1 h-3 w-3" />
            <span>Deadline: {formatDate(opportunity.applicationDeadline)}</span>
          </div>
        )}
        <div className="mt-4 flex justify-between items-center">
          <div className="flex-1">
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm font-medium text-primary-700 hover:text-primary-800" 
              asChild
            >
              <Link href={`/opportunity/${opportunity.id}`}>
                View Details
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            {opportunity.externalLink && (
              <div className="mt-2">
                {(opportunity.externalLink.includes('example.org') || 
                  opportunity.externalLink.includes('example.com')) ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs bg-neutral-100 text-neutral-500 cursor-not-allowed opacity-70"
                    disabled
                  >
                    No Official Website
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      if (opportunity.externalLink) {
                        window.open(opportunity.externalLink, '_blank');
                      }
                    }}
                  >
                    Visit Website
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button 
            className="p-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700" 
            variant="ghost" 
            size="icon"
            onClick={handleBookmarkClick}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-primary-700" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
