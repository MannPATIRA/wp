import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Opportunity } from "@shared/schema";
import { 
  CalendarDays, 
  MapPin, 
  DollarSign, 
  GraduationCap, 
  Star, 
  CheckCircle, 
  ClipboardList, 
  Bookmark, 
  BookmarkCheck,
  ExternalLink,
  Plus,
  Calendar,
  Share
} from "lucide-react";
import { Link } from "wouter";

interface OpportunityDetailProps {
  opportunity: Opportunity;
  userOpportunity?: any;
  onSave: (isSaved: boolean) => void;
  onApply: () => void;
}

export function OpportunityDetail({ opportunity, userOpportunity, onSave, onApply }: OpportunityDetailProps) {
  // Handle saving/unsaving the opportunity
  const handleSaveClick = () => {
    onSave(!userOpportunity?.isSaved);
  };

  // Get material icon as a component
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "science":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2v7.31M14 9.3V2M8.5 2h7M14 9.3a6.5 6.5 0 1 1-4 0" />
            <path d="M5.58 16.5h12.85" />
          </svg>
        );
      case "groups":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "volunteer_activism":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v8M8 12h8" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 14.25v-4.5L12 12l3-2.25v4.5" />
          </svg>
        );
    }
  };

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

  // Format application date nicely
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Ongoing";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="shadow-sm border border-neutral-200 overflow-hidden">
      <div className={`h-48 ${opportunity.category === "Research" ? "bg-primary-600" : opportunity.category === "Leadership" ? "bg-secondary-600" : opportunity.category === "Community" ? "bg-amber-600" : "bg-green-600"} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          {getIconComponent(opportunity.imageIcon || "event")}
        </div>
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button 
            onClick={handleSaveClick} 
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
            variant="ghost"
            size="icon"
          >
            {userOpportunity?.isSaved ? (
              <BookmarkCheck className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
          <Button className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white" variant="ghost" size="icon">
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getCategoryColorClass(opportunity.category)}>{opportunity.category}</Badge>
              {opportunity.tags?.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
              {opportunity.impactRating && opportunity.impactRating >= 4 && (
                <Badge className="bg-green-100 text-green-800">High Impact</Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 font-poppins">{opportunity.title}</h2>
            <p className="text-neutral-600 mt-1">{opportunity.description}</p>
          </div>
          <div className="flex flex-col items-end">
            {opportunity.applicationDeadline && (
              <div className="text-sm font-medium text-neutral-700 bg-neutral-100 px-3 py-1 rounded-md">
                Application Deadline: <span className="text-primary-700">{formatDate(opportunity.applicationDeadline)}</span>
              </div>
            )}
            {opportunity.admissionRate && (
              <div className="text-sm font-medium mt-2">
                Admission Rate: <span className="text-primary-700">{opportunity.admissionRate}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800 font-poppins">Program Description</h3>
              <div className="mt-2 text-neutral-700 space-y-3">
                <p>{opportunity.description}</p>
              </div>
            </div>
            
            {opportunity.benefits && opportunity.benefits.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 font-poppins">Benefits for {opportunity.targetMajor || "University"} Applicants</h3>
                <ul className="mt-2 text-neutral-700 space-y-2">
                  {opportunity.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="text-green-600 mr-2 mt-0.5 h-5 w-5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {opportunity.requirements && opportunity.requirements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 font-poppins">Application Requirements</h3>
                <ul className="mt-2 text-neutral-700 space-y-2">
                  {opportunity.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <ClipboardList className="text-neutral-600 mr-2 mt-0.5 h-5 w-5" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {opportunity.testimonials && opportunity.testimonials.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 font-poppins">What Past Participants Say</h3>
                <div className="mt-3 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                  {opportunity.testimonials.map((testimonial, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-neutral-900">{testimonial.name}</p>
                        <p className="text-sm text-neutral-700 mt-1">{testimonial.quote}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <h3 className="text-base font-semibold text-neutral-800 font-poppins">Program Details</h3>
              <div className="mt-3 space-y-3">
                {opportunity.programDates && (
                  <div className="flex items-start">
                    <CalendarDays className="text-neutral-600 mr-2 h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Program Dates</p>
                      <p className="text-sm text-neutral-600">{opportunity.programDates}</p>
                    </div>
                  </div>
                )}
                {opportunity.location && (
                  <div className="flex items-start">
                    <MapPin className="text-neutral-600 mr-2 h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Location</p>
                      <p className="text-sm text-neutral-600">{opportunity.location}</p>
                    </div>
                  </div>
                )}
                {opportunity.cost && (
                  <div className="flex items-start">
                    <DollarSign className="text-neutral-600 mr-2 h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Cost</p>
                      <p className="text-sm text-neutral-600">{opportunity.cost}</p>
                    </div>
                  </div>
                )}
                {opportunity.eligibility && (
                  <div className="flex items-start">
                    <GraduationCap className="text-neutral-600 mr-2 h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Eligibility</p>
                      <p className="text-sm text-neutral-600">{opportunity.eligibility}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {opportunity.universityImpact && (
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                <h3 className="text-base font-semibold text-primary-800 font-poppins">University Admission Impact</h3>
                <div className="flex items-center mt-2">
                  <div className="flex-1 flex items-center">
                    {[...Array(opportunity.impactRating || 3)].map((_, i) => (
                      <Star key={i} className="text-primary-700 mr-1 h-4 w-4" fill="currentColor" />
                    ))}
                    {[...Array(5 - (opportunity.impactRating || 3))].map((_, i) => (
                      <Star key={i} className="text-primary-700 mr-1 h-4 w-4" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-primary-800">
                    {opportunity.impactRating === 5 ? "Very High" : 
                     opportunity.impactRating === 4 ? "High" : 
                     opportunity.impactRating === 3 ? "Medium" : 
                     opportunity.impactRating === 2 ? "Low" : "Very Low"}
                  </span>
                </div>
                <p className="text-sm text-primary-700 mt-3">{opportunity.universityImpact}</p>
              </div>
            )}
            
            {opportunity.applicationTimeline && opportunity.applicationTimeline.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-neutral-200">
                <h3 className="text-base font-semibold text-neutral-800 font-poppins">Application Timeline</h3>
                <div className="mt-3 relative">
                  <div className="absolute top-0 bottom-0 left-2.5 w-px bg-neutral-200"></div>
                  <div className="space-y-4">
                    {opportunity.applicationTimeline.map((item, index) => (
                      <div key={index} className="relative pl-10">
                        <div className="absolute left-0 top-1 h-5 w-5 rounded-full bg-neutral-200 flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-neutral-600"></div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-neutral-700">{item.date}</p>
                          <p className="text-sm text-neutral-900">{item.event}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col space-y-3">
              <Button onClick={onApply} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Apply Now
              </Button>
              <Button variant="outline" className="inline-flex items-center justify-center" asChild>
                <a href={opportunity.externalLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit Official Website
                </a>
              </Button>
              <Button
                variant="outline"
                className="inline-flex items-center justify-center"
                onClick={handleSaveClick}
              >
                {userOpportunity?.isSaved ? (
                  <>
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    Saved to My List
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save to My List
                  </>
                )}
              </Button>
              <Button variant="outline" className="inline-flex items-center justify-center">
                <Calendar className="mr-2 h-4 w-4" />
                Add to My Timeline
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
