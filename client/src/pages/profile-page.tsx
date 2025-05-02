import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserProfileSchema, UserProfile } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useUser } from "@/hooks/use-user";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, X } from "lucide-react";

// Extended schema for the profile form
const profileFormSchema = insertUserProfileSchema.extend({
  achievementInput: z.string().optional(),
  extracurricularInput: z.string().optional(),
  // Keep applicationDeadline as string instead of transforming to Date
  applicationDeadline: z.string().nullable().optional(),
}).omit({ userId: true });

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  
  // Load user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  // Form handling
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      gpa: profile?.gpa || "",
      sat: profile?.sat || undefined,
      act: profile?.act || undefined,
      apCourses: profile?.apCourses || undefined,
      targetUniversity: profile?.targetUniversity || "",
      targetMajor: profile?.targetMajor || "",
      applicationDeadline: profile?.applicationDeadline ? new Date(profile.applicationDeadline).toISOString().split('T')[0] : undefined,
      achievements: profile?.achievements || [],
      extracurriculars: profile?.extracurriculars || [],
      achievementInput: "",
      extracurricularInput: "",
    },
    values: {
      gpa: profile?.gpa || "",
      sat: profile?.sat || undefined,
      act: profile?.act || undefined,
      apCourses: profile?.apCourses || undefined,
      targetUniversity: profile?.targetUniversity || "",
      targetMajor: profile?.targetMajor || "",
      applicationDeadline: profile?.applicationDeadline ? new Date(profile.applicationDeadline).toISOString().split('T')[0] : undefined,
      achievements: profile?.achievements || [],
      extracurriculars: profile?.extracurriculars || [],
      achievementInput: "",
      extracurricularInput: "",
    },
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const { achievementInput, extracurricularInput, ...profileData } = data;
      
      // Format applicationDeadline properly for the server
      // Keep it as a raw string instead of converting to Date object
      // This avoids the Date validation error on the server
      if (profileData.applicationDeadline) {
        // Always make sure applicationDeadline is a string, not a Date object
        // No instanceof check needed since we've modified the schema to keep it as string
        console.log("Submitting profile data with date:", profileData.applicationDeadline);
      }
      
      const response = await apiRequest("POST", "/api/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message || "There was an error updating your profile",
        variant: "destructive",
      });
    },
  });

  // Add achievement to the form
  const addAchievement = () => {
    const achievementInput = form.getValues("achievementInput");
    if (achievementInput.trim()) {
      const currentAchievements = form.getValues("achievements") || [];
      form.setValue("achievements", [...currentAchievements, achievementInput.trim()]);
      form.setValue("achievementInput", "");
    }
  };

  // Remove achievement from the form
  const removeAchievement = (index: number) => {
    const currentAchievements = form.getValues("achievements") || [];
    form.setValue("achievements", currentAchievements.filter((_, i) => i !== index));
  };

  // Add extracurricular to the form
  const addExtracurricular = () => {
    const extracurricularInput = form.getValues("extracurricularInput");
    if (extracurricularInput.trim()) {
      const currentExtracurriculars = form.getValues("extracurriculars") || [];
      form.setValue("extracurriculars", [...currentExtracurriculars, extracurricularInput.trim()]);
      form.setValue("extracurricularInput", "");
    }
  };

  // Remove extracurricular from the form
  const removeExtracurricular = (index: number) => {
    const currentExtracurriculars = form.getValues("extracurriculars") || [];
    form.setValue("extracurriculars", currentExtracurriculars.filter((_, i) => i !== index));
  };

  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    saveProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-neutral-50">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <MobileMenu 
            isOpen={isMobileMenuOpen} 
            onClose={() => setIsMobileMenuOpen(false)}
            onOpen={() => setIsMobileMenuOpen(true)}
          />
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-neutral-900 font-poppins mb-4">Profile Information</h1>
            <p className="text-neutral-600 mb-6">
              Update your academic information and university goals to receive personalized recommendations.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                    <CardDescription>
                      Enter your current academic information to help us assess your university readiness.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="gpa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GPA</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 3.8 or 3.8/4.0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter your current GPA, optionally with the scale (e.g., 3.8/4.0)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SAT Score</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 1450" 
                                {...field} 
                                value={field.value || ""}
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="act"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ACT Score</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 32" 
                                {...field} 
                                value={field.value || ""}
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="apCourses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of AP Courses</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g., 4" 
                                {...field} 
                                value={field.value || ""}
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Achievements */}
                    <div>
                      <FormLabel>Academic Achievements</FormLabel>
                      <div className="flex mt-2 mb-3">
                        <FormField
                          control={form.control}
                          name="achievementInput"
                          render={({ field }) => (
                            <FormItem className="flex-1 mr-2">
                              <FormControl>
                                <Input 
                                  placeholder="Enter an achievement" 
                                  {...field} 
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addAchievement();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={addAchievement}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {form.watch("achievements")?.map((achievement, index) => (
                          <div key={index} className="flex items-center bg-neutral-50 p-2 rounded-md">
                            <span className="flex-1">{achievement}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeAchievement(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <FormDescription className="mt-2">
                        Add your academic achievements, awards, and honors.
                      </FormDescription>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>University Goals</CardTitle>
                    <CardDescription>
                      Tell us about your target university and major to receive tailored recommendations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="targetUniversity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target University</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Harvard University" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="targetMajor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Major</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Computer Science" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="applicationDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Application Deadline</FormLabel>
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
                          <FormDescription>
                            When is the application deadline for your target university?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Extracurricular Activities */}
                    <div>
                      <FormLabel>Extracurricular Activities</FormLabel>
                      <div className="flex mt-2 mb-3">
                        <FormField
                          control={form.control}
                          name="extracurricularInput"
                          render={({ field }) => (
                            <FormItem className="flex-1 mr-2">
                              <FormControl>
                                <Input 
                                  placeholder="Enter an activity" 
                                  {...field} 
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addExtracurricular();
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" onClick={addExtracurricular}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {form.watch("extracurriculars")?.map((activity, index) => (
                          <div key={index} className="flex items-center bg-neutral-50 p-2 rounded-md">
                            <span className="flex-1">{activity}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeExtracurricular(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <FormDescription className="mt-2">
                        Add your current extracurricular activities and leadership positions.
                      </FormDescription>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => form.reset()}>
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveProfileMutation.isPending}
                  >
                    {saveProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Profile"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </main>
      </div>
    </div>
  );
}
