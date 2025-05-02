import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useUser } from "@/hooks/use-user";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TimelineEvent, InsertTimelineEvent } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, School, BookOpen, Award, Users, Plus, Loader2, Edit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Schema for timeline event form
const timelineEventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  eventDate: z.string().min(1, "Event date is required")
    .transform(str => new Date(str)), // Convert string to Date object
  type: z.string().min(1, "Event type is required"),
  icon: z.string().optional(),
});

type TimelineEventFormValues = z.infer<typeof timelineEventSchema>;

export default function TimelinePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  
  // Fetch timeline events
  const { data: timelineEvents, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ["/api/timeline"],
  });
  
  // Add timeline event form
  const form = useForm<TimelineEventFormValues>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventDate: new Date().toISOString().split('T')[0], // Date inputs require ISO format string YYYY-MM-DD
      type: "deadline",
      icon: "",
    },
  });
  
  // Add timeline event mutation
  const addEventMutation = useMutation({
    mutationFn: async (data: TimelineEventFormValues) => {
      // Convert form data to the expected format
      const eventData: Omit<InsertTimelineEvent, "userId"> = {
        title: data.title,
        description: data.description || "",
        // Always keep eventDate as a string in YYYY-MM-DD format
        // We've fixed the server to handle string dates properly
        eventDate: data.eventDate,
        type: data.type,
        icon: data.icon || getIconForType(data.type),
      };
      
      console.log("Submitting timeline event with date:", eventData.eventDate);
      
      const response = await apiRequest("POST", "/api/timeline", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      setIsAddEventDialogOpen(false);
      form.reset();
      toast({
        title: "Event added",
        description: "Your timeline event has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding event",
        description: error.message || "There was an error adding the event",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: TimelineEventFormValues) => {
    addEventMutation.mutate(data);
  };

  // Get appropriate icon name for event type
  const getIconForType = (type: string): string => {
    switch (type) {
      case "deadline":
        return "calendar_today";
      case "application":
        return "description";
      case "test":
        return "assignment";
      case "visit":
        return "school";
      case "interview":
        return "person";
      case "decision":
        return "announcement";
      default:
        return "event";
    }
  };

  // Get icon component for a timeline event
  const getIconComponent = (type: string) => {
    switch (type) {
      case "deadline":
        return <Calendar className="h-5 w-5" />;
      case "application":
        return <BookOpen className="h-5 w-5" />;
      case "test":
        return <Award className="h-5 w-5" />;
      case "visit":
        return <School className="h-5 w-5" />;
      case "interview":
        return <Users className="h-5 w-5" />;
      case "decision":
        return <Award className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  // Get color class for a timeline event type
  const getColorClass = (type: string) => {
    switch (type) {
      case "deadline":
        return "bg-amber-100 text-amber-700";
      case "application":
        return "bg-primary-100 text-primary-700";
      case "test":
        return "bg-green-100 text-green-700";
      case "visit":
        return "bg-secondary-100 text-secondary-700";
      case "interview":
        return "bg-purple-100 text-purple-700";
      case "decision":
        return "bg-red-100 text-red-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  // Filter events by month and year, then sort by date
  const sortAndGroupEvents = (events: TimelineEvent[] = []) => {
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );
    
    // Group events by month and year
    const groupedEvents: Record<string, TimelineEvent[]> = {};
    
    sortedEvents.forEach(event => {
      const date = new Date(event.eventDate);
      const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!groupedEvents[monthYear]) {
        groupedEvents[monthYear] = [];
      }
      
      groupedEvents[monthYear].push(event);
    });
    
    return groupedEvents;
  };

  const groupedEvents = sortAndGroupEvents(timelineEvents);

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
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 font-poppins">Application Timeline</h1>
                  <p className="mt-1 text-sm text-neutral-600">
                    Track important dates for your university application process
                  </p>
                </div>
                <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-3 sm:mt-0">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Timeline Event</DialogTitle>
                      <DialogDescription>
                        Add an important date to your application timeline
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Title</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., SAT Test Date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Add details about the event" 
                                  className="resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="eventDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    value={field.value || ""} 
                                    onChange={field.onChange}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Type</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="deadline">Deadline</SelectItem>
                                    <SelectItem value="application">Application</SelectItem>
                                    <SelectItem value="test">Test</SelectItem>
                                    <SelectItem value="visit">Campus Visit</SelectItem>
                                    <SelectItem value="interview">Interview</SelectItem>
                                    <SelectItem value="decision">Decision</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={addEventMutation.isPending}
                          >
                            {addEventMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding...
                              </>
                            ) : "Add Event"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Timeline Display */}
              <Card className="shadow-sm border border-neutral-200">
                <CardContent className="p-6">
                  {timelineEvents?.length === 0 ? (
                    <div className="text-center py-10">
                      <Calendar className="h-12 w-12 mb-3 text-neutral-400 mx-auto" />
                      <h3 className="text-lg font-medium text-neutral-800 mb-2">No Events Added Yet</h3>
                      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                        Add important dates like application deadlines, test dates, and campus visits to your timeline.
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button onClick={() => setIsAddEventDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Event
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute top-0 bottom-0 left-4 w-px bg-neutral-200"></div>
                      
                      <div className="space-y-8">
                        {Object.entries(groupedEvents).map(([monthYear, events]) => (
                          <div key={monthYear} className="relative">
                            <h3 className="text-md font-semibold text-neutral-700 mb-4 pl-10">
                              {monthYear}
                            </h3>
                            <div className="space-y-4">
                              {events.map((event) => (
                                <div key={event.id} className="relative pl-10">
                                  <div className={`absolute left-0 top-1 h-8 w-8 rounded-full ${getColorClass(event.type)} flex items-center justify-center`}>
                                    {getIconComponent(event.type)}
                                  </div>
                                  <div>
                                    <p className={`text-xs font-medium ${getColorClass(event.type).split(" ")[1]}`}>
                                      {new Date(event.eventDate).toLocaleDateString('en-US', { 
                                        weekday: 'short',
                                        month: 'short', 
                                        day: 'numeric'
                                      })}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-neutral-900">{event.title}</p>
                                      <div className="flex space-x-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                          <Edit className="h-3.5 w-3.5 text-neutral-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                          <Trash className="h-3.5 w-3.5 text-neutral-500" />
                                        </Button>
                                      </div>
                                    </div>
                                    {event.description && (
                                      <p className="text-xs text-neutral-600 mt-1">{event.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
