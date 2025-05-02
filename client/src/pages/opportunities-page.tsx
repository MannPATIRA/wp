import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { Opportunity } from "@shared/schema";
import { OpportunityCard } from "@/components/opportunity/opportunity-card";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OpportunitiesPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useUser();
  
  // Fetch opportunities
  const { data: opportunities, isLoading } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  // Fetch saved opportunities
  const { data: userOpportunities } = useQuery<any[]>({
    queryKey: ["/api/user/opportunities"],
  });

  // Filter opportunities based on search query and category
  const filteredOpportunities = opportunities?.filter(opportunity => {
    const matchesSearch = searchQuery === "" || 
      opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      opportunity.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || opportunity.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Check if an opportunity is saved by the user
  const isOpportunitySaved = (opportunityId: number) => {
    return userOpportunities?.some(
      (uo) => uo.opportunityId === opportunityId && uo.isSaved
    );
  };

  // Get unique categories from opportunities
  const categories = opportunities 
    ? Array.from(new Set(opportunities.map(o => o.category)))
    : [];

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
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 font-poppins">Opportunities</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Discover activities that will help you get into your dream university
                </p>
              </div>
            </div>

            {/* Search and Filter */}
            <Card className="mb-6 shadow-sm border border-neutral-200">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-4 w-4" />
                    <Input
                      placeholder="Search opportunities..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-40">
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opportunities grid */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredOpportunities && filteredOpportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredOpportunities.map((opportunity) => (
                  <OpportunityCard 
                    key={opportunity.id} 
                    opportunity={opportunity} 
                    isSaved={isOpportunitySaved(opportunity.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-700 mb-2">No opportunities found</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-6">
                  {searchQuery 
                    ? `No opportunities match "${searchQuery}" in the ${selectedCategory === "all" ? "selected categories" : selectedCategory} category.` 
                    : "No opportunities are available in this category."}
                </p>
                {searchQuery && (
                  <Button onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
