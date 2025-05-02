import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@shared/schema";
import { Link } from "wouter";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, School, BookOpen, Star, Clock, Award, Users, BookmarkCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function UniversityGoalsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();
  
  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  // Calculate days until application deadline
  const getDaysUntilDeadline = () => {
    if (!profile?.applicationDeadline) return null;
    
    const deadlineDate = new Date(profile.applicationDeadline);
    const today = new Date();
    const differenceInTime = deadlineDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays > 0 ? differenceInDays : 0;
  };

  // Calculate admission chances based on profile completeness
  const calculateAdmissionChances = () => {
    if (!profile) return { percentage: 0, status: "Unknown" };
    
    let score = 0;
    let maxScore = 0;
    
    // Academic factors
    if (profile.gpa) {
      maxScore += 25;
      const gpaValue = parseFloat(profile.gpa.split('/')[0]);
      const gpaScale = profile.gpa.includes('/') ? parseFloat(profile.gpa.split('/')[1]) : 4.0;
      
      if (gpaValue / gpaScale >= 0.9) score += 25;
      else if (gpaValue / gpaScale >= 0.8) score += 20;
      else if (gpaValue / gpaScale >= 0.75) score += 15;
      else score += 10;
    }
    
    if (profile.sat) {
      maxScore += 20;
      if (profile.sat >= 1500) score += 20;
      else if (profile.sat >= 1400) score += 15;
      else if (profile.sat >= 1300) score += 10;
      else score += 5;
    }
    
    if (profile.apCourses) {
      maxScore += 15;
      if (profile.apCourses >= 8) score += 15;
      else if (profile.apCourses >= 5) score += 12;
      else if (profile.apCourses >= 3) score += 8;
      else score += 4;
    }
    
    // Extracurricular factors
    if (profile.extracurriculars && profile.extracurriculars.length > 0) {
      maxScore += 20;
      if (profile.extracurriculars.length >= 6) score += 20;
      else if (profile.extracurriculars.length >= 4) score += 15;
      else if (profile.extracurriculars.length >= 2) score += 10;
      else score += 5;
    }
    
    // Achievements
    if (profile.achievements && profile.achievements.length > 0) {
      maxScore += 20;
      if (profile.achievements.length >= 5) score += 20;
      else if (profile.achievements.length >= 3) score += 15;
      else score += 10;
    }
    
    // Calculate percentage
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    // Determine status
    let status = "Unknown";
    if (percentage >= 85) status = "Excellent";
    else if (percentage >= 70) status = "Very Good";
    else if (percentage >= 50) status = "Good";
    else if (percentage >= 30) status = "Fair";
    else status = "Needs Improvement";
    
    return { percentage, status };
  };

  const admissionChances = calculateAdmissionChances();
  const daysUntilDeadline = getDaysUntilDeadline();

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
            <div className="space-y-6 max-w-5xl mx-auto">
              <header>
                <h1 className="text-2xl font-bold text-neutral-900 font-poppins">University Goals</h1>
                <p className="mt-1 text-sm text-neutral-600">
                  Track your progress towards your dream university and manage your application goals.
                </p>
              </header>

              {/* Target University Card */}
              <Card className="shadow-sm border border-neutral-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-xl">Target University</CardTitle>
                    <CardDescription>Your current university goal and application timeline</CardDescription>
                  </div>
                  <Link href="/profile">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Goals
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {profile?.targetUniversity ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="p-2 bg-primary-100 rounded-full mr-3">
                            <School className="h-6 w-6 text-primary-800" />
                          </div>
                          <div>
                            <h3 className="font-medium">Target University</h3>
                            <p className="text-neutral-700">{profile.targetUniversity}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="p-2 bg-secondary-100 rounded-full mr-3">
                            <BookOpen className="h-6 w-6 text-secondary-800" />
                          </div>
                          <div>
                            <h3 className="font-medium">Target Major</h3>
                            <p className="text-neutral-700">{profile.targetMajor || "Not specified"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="p-2 bg-amber-100 rounded-full mr-3">
                            <Star className="h-6 w-6 text-amber-800" />
                          </div>
                          <div>
                            <h3 className="font-medium">Admission Chances</h3>
                            <div className="mt-1">
                              <Progress value={admissionChances.percentage} className="h-2 mt-1 mb-1" />
                              <p className="text-sm text-neutral-600">{admissionChances.percentage}% - {admissionChances.status}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="p-2 bg-orange-100 rounded-full mr-3">
                            <Clock className="h-6 w-6 text-orange-800" />
                          </div>
                          <div>
                            <h3 className="font-medium">Application Deadline</h3>
                            <p className="text-neutral-700">
                              {profile.applicationDeadline 
                                ? new Date(profile.applicationDeadline).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  }) 
                                : "Not specified"}
                            </p>
                            {daysUntilDeadline !== null && (
                              <p className="text-sm font-medium mt-1 text-orange-700">
                                {daysUntilDeadline === 0 
                                  ? "Today is the deadline!" 
                                  : `${daysUntilDeadline} days remaining`}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="p-2 bg-green-100 rounded-full mr-3">
                            <Award className="h-6 w-6 text-green-800" />
                          </div>
                          <div>
                            <h3 className="font-medium">Academic Achievements</h3>
                            <p className="text-neutral-700">
                              {profile.achievements && profile.achievements.length > 0
                                ? `${profile.achievements.length} achievements recorded`
                                : "No achievements recorded yet"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="p-2 bg-blue-100 rounded-full mr-3">
                            <Users className="h-6 w-6 text-blue-800" />
                          </div>
                          <div>
                            <h3 className="font-medium">Extracurricular Activities</h3>
                            <p className="text-neutral-700">
                              {profile.extracurriculars && profile.extracurriculars.length > 0
                                ? `${profile.extracurriculars.length} activities recorded`
                                : "No activities recorded yet"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <School className="h-12 w-12 mb-3 text-neutral-400 mx-auto" />
                      <h3 className="text-lg font-medium text-neutral-800 mb-2">No Target University Set</h3>
                      <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                        Set your target university and major to receive personalized recommendations 
                        and track your application progress.
                      </p>
                      <Link href="/profile">
                        <Button>
                          Set University Goals
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Application Requirements Card */}
              {profile?.targetUniversity && (
                <Card className="shadow-sm border border-neutral-200">
                  <CardHeader>
                    <CardTitle className="text-xl">Application Requirements</CardTitle>
                    <CardDescription>
                      Key requirements for {profile.targetUniversity}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-neutral-800">Academic Requirements</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary-500 mr-2"></div>
                              <span className="text-sm">GPA (Average for admitted students)</span>
                            </div>
                            <span className="text-sm font-medium">{profile?.targetUniversity?.includes("Harvard") ? "3.9/4.0" : "3.8/4.0"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary-500 mr-2"></div>
                              <span className="text-sm">SAT (Middle 50% range)</span>
                            </div>
                            <span className="text-sm font-medium">{profile?.targetUniversity?.includes("Harvard") ? "1460-1580" : "1420-1550"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary-500 mr-2"></div>
                              <span className="text-sm">ACT (Middle 50% range)</span>
                            </div>
                            <span className="text-sm font-medium">{profile?.targetUniversity?.includes("Harvard") ? "33-35" : "32-35"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-2 w-2 rounded-full bg-primary-500 mr-2"></div>
                              <span className="text-sm">AP/IB Courses (Recommended)</span>
                            </div>
                            <span className="text-sm font-medium">{profile?.targetUniversity?.includes("Harvard") ? "5-8" : "4-7"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold text-neutral-800">Additional Requirements</h3>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <BookmarkCheck className="h-5 w-5 text-primary-700 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Letters of Recommendation</p>
                              <p className="text-xs text-neutral-600">2-3 letters from teachers who know you well</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <BookmarkCheck className="h-5 w-5 text-primary-700 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Personal Essay</p>
                              <p className="text-xs text-neutral-600">650-word Common App essay + supplemental essays</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <BookmarkCheck className="h-5 w-5 text-primary-700 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Extracurricular Activities</p>
                              <p className="text-xs text-neutral-600">Leadership roles and sustained commitment</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <BookmarkCheck className="h-5 w-5 text-primary-700 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Application Fee</p>
                              <p className="text-xs text-neutral-600">${profile?.targetUniversity?.includes("Harvard") ? "75" : "80"} (fee waivers available)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-start border-t border-neutral-200 pt-4">
                    <p className="text-sm text-neutral-600 mb-3">
                      Note: Requirements may change. Always verify with the official university website for the most up-to-date information.
                    </p>
                    <Button variant="outline" className="inline-flex items-center">
                      <BookmarkCheck className="h-4 w-4 mr-2" />
                      Visit {profile.targetUniversity} Admissions Website
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
