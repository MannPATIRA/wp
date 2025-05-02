import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Opportunity } from "@shared/schema";
import { OpportunityCard } from "@/components/opportunity/opportunity-card";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

interface RecommendedActivitiesProps {
  recommendations: Opportunity[];
}

export function RecommendedActivities({ recommendations }: RecommendedActivitiesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showAll, setShowAll] = useState<boolean>(false);
  
  // Fetch saved opportunities to check if any recommendations are saved
  const { data: userOpportunities } = useQuery<any[]>({
    queryKey: ["/api/user/opportunities"],
  });

  // Get unique categories from recommendations
  const categories = recommendations 
    ? ["All", ...Array.from(new Set(recommendations.map(r => r.category)))]
    : ["All"];

  // Filter recommendations by selected category
  const filteredRecommendations = recommendations.filter(recommendation => 
    selectedCategory === "All" || recommendation.category === selectedCategory
  );

  // Display only first 3 recommendations unless showAll is true
  const displayedRecommendations = showAll 
    ? filteredRecommendations 
    : filteredRecommendations.slice(0, 3);

  // Check if an opportunity is saved by the user
  const isOpportunitySaved = (opportunityId: number) => {
    return userOpportunities?.some(
      (uo) => uo.opportunityId === opportunityId && uo.isSaved
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-800 font-poppins">Recommended Activities</h2>
        <div>
          <Select
            defaultValue="All"
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {recommendations.length === 0 ? (
        <Card className="border border-neutral-200 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary-100 p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No Recommendations Yet</h3>
            <p className="text-neutral-600 max-w-md mb-6">
              Complete your profile with your academic information and university goals to receive personalized recommendations.
            </p>
            <Button asChild>
              <a href="/profile">Complete Your Profile</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedRecommendations.map((opportunity) => (
              <OpportunityCard 
                key={opportunity.id} 
                opportunity={opportunity} 
                isSaved={isOpportunitySaved(opportunity.id)}
              />
            ))}
          </div>
          
          {filteredRecommendations.length > 3 && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show Fewer Activities" : "View More Activities"}
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
