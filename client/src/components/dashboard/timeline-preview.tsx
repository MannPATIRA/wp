import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimelineEvent } from "@shared/schema";
import { Calendar, School, ClipboardEdit, Award, Users, Clock } from "lucide-react";
import { Link } from "wouter";

interface TimelinePreviewProps {
  events: TimelineEvent[];
}

export function TimelinePreview({ events }: TimelinePreviewProps) {
  // Sort events by date (ascending)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  // Take only the next 3 upcoming events
  const upcomingEvents = sortedEvents.filter(event => 
    new Date(event.eventDate) >= new Date()
  ).slice(0, 3);

  // Get appropriate icon component based on event type
  const getIconComponent = (type: string) => {
    switch (type) {
      case "deadline":
        return <Calendar className="text-amber-700 text-sm" />;
      case "visit":
        return <School className="text-primary-700 text-sm" />;
      case "application":
        return <ClipboardEdit className="text-secondary-700 text-sm" />;
      case "test":
        return <Award className="text-green-700 text-sm" />;
      case "interview":
        return <Users className="text-purple-700 text-sm" />;
      default:
        return <Clock className="text-neutral-700 text-sm" />;
    }
  };

  // Get color class for event type
  const getColorClass = (type: string) => {
    switch (type) {
      case "deadline":
        return "bg-amber-100 text-amber-700";
      case "visit":
        return "bg-primary-100 text-primary-700";
      case "application":
        return "bg-secondary-100 text-secondary-700";
      case "test":
        return "bg-green-100 text-green-700";
      case "interview":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  return (
    <Card className="shadow-sm border border-neutral-200">
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold text-neutral-800 font-poppins mb-4">Timeline</h2>
        
        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Calendar className="h-10 w-10 text-neutral-300 mb-2" />
            <p className="text-neutral-600 text-center mb-4">No upcoming events</p>
            <Link href="/timeline">
              <Button variant="outline" size="sm">Add Event</Button>
            </Link>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-4 w-px bg-neutral-200"></div>
            
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="relative pl-10">
                  <div className={`absolute left-0 top-1 h-8 w-8 rounded-full ${getColorClass(event.type)} flex items-center justify-center`}>
                    {getIconComponent(event.type)}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${getColorClass(event.type).split(" ")[1]}`}>
                      {new Date(event.eventDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm font-medium text-neutral-900">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-neutral-600 mt-1">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Link href="/timeline">
              <Button 
                variant="link" 
                className="mt-4 text-sm text-primary-700 font-medium hover:text-primary-800 p-0 h-auto"
              >
                View full timeline
                <span className="material-icons text-sm ml-1">arrow_forward</span>
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
