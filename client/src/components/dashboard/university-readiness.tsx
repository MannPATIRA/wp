import { Card, CardContent } from "@/components/ui/card";
import { UserProfile } from "@shared/schema";
import { Book, Users, FileText, Mail } from "lucide-react";

interface UniversityReadinessProps {
  profile?: UserProfile;
}

export function UniversityReadiness({ profile }: UniversityReadinessProps) {
  // Calculate readiness percentages based on profile data
  const academicProgress = calculateAcademicProgress(profile);
  const extracurricularProgress = calculateExtracurricularProgress(profile);
  const essayProgress = 40; // This would be calculated based on essay state
  const recommendationProgress = 50; // This would be calculated based on recommendations

  return (
    <Card className="shadow-sm border border-neutral-200">
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold text-neutral-800 font-poppins">University Readiness</h2>
        <p className="text-sm text-neutral-600 mt-1">
          Your progress toward meeting {profile?.targetUniversity || "your university's"} admission requirements
        </p>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Academic Progress */}
          <ProgressItem 
            title="Academics"
            icon={<Book className="h-5 w-5 text-primary-700" />}
            progress={academicProgress}
            description={getAcademicDescription(academicProgress)}
            bgColor="bg-primary-100"
            progressColor="bg-primary-600"
          />
          
          {/* Extracurricular Progress */}
          <ProgressItem
            title="Extracurriculars"
            icon={<Users className="h-5 w-5 text-secondary-700" />}
            progress={extracurricularProgress}
            description={getExtracurricularDescription(extracurricularProgress)}
            bgColor="bg-secondary-100"
            progressColor="bg-secondary-600"
          />
          
          {/* Essay Progress */}
          <ProgressItem
            title="Essays"
            icon={<FileText className="h-5 w-5 text-amber-700" />}
            progress={essayProgress}
            description="Early drafts in progress"
            bgColor="bg-amber-100"
            progressColor="bg-amber-600"
          />
          
          {/* Letters of Rec Progress */}
          <ProgressItem
            title="Recommendations"
            icon={<Mail className="h-5 w-5 text-neutral-700" />}
            progress={recommendationProgress}
            description="2 of 4 confirmed"
            bgColor="bg-neutral-100"
            progressColor="bg-neutral-600"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressItem({ 
  title, 
  icon, 
  progress, 
  description, 
  bgColor, 
  progressColor 
}: { 
  title: string; 
  icon: React.ReactNode; 
  progress: number; 
  description: string; 
  bgColor: string; 
  progressColor: string;
}) {
  return (
    <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
      <div className="flex items-center">
        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
          <div className="mt-1">
            <div className="bg-neutral-200 rounded-full h-2 w-full">
              <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <p className="text-xs text-neutral-600 mt-1">{progress}% - {description}</p>
        </div>
      </div>
    </div>
  );
}

// Helper functions to calculate progress
function calculateAcademicProgress(profile?: UserProfile): number {
  if (!profile) return 0;
  
  let score = 0;
  let total = 0;
  
  // GPA
  if (profile.gpa) {
    const gpaValue = parseFloat(profile.gpa.split('/')[0]);
    const gpaScale = profile.gpa.includes('/') ? parseFloat(profile.gpa.split('/')[1]) : 4.0;
    
    // Assume higher GPA is better, with 3.5+ being excellent
    if (gpaValue / gpaScale >= 0.875) score += 25; // 3.5/4.0 or equivalent
    else if (gpaValue / gpaScale >= 0.8) score += 20; // 3.2/4.0 or equivalent
    else if (gpaValue / gpaScale >= 0.75) score += 15; // 3.0/4.0 or equivalent
    else score += 10;
    
    total += 25;
  }
  
  // SAT
  if (profile.sat) {
    if (profile.sat >= 1500) score += 25;
    else if (profile.sat >= 1400) score += 20;
    else if (profile.sat >= 1300) score += 15;
    else score += 10;
    
    total += 25;
  }
  
  // AP Courses
  if (profile.apCourses) {
    if (profile.apCourses >= 8) score += 25;
    else if (profile.apCourses >= 5) score += 20;
    else if (profile.apCourses >= 3) score += 15;
    else score += 10;
    
    total += 25;
  }
  
  // Achievements
  if (profile.achievements && profile.achievements.length > 0) {
    if (profile.achievements.length >= 5) score += 25;
    else if (profile.achievements.length >= 3) score += 20;
    else score += 15;
    
    total += 25;
  }
  
  // If no data is available, return 0
  if (total === 0) return 0;
  
  // Calculate percentage
  return Math.round((score / total) * 100);
}

function calculateExtracurricularProgress(profile?: UserProfile): number {
  if (!profile || !profile.extracurriculars || profile.extracurriculars.length === 0) {
    return 0;
  }
  
  // Simple calculation based on number of extracurriculars
  const count = profile.extracurriculars.length;
  
  if (count >= 10) return 100;
  if (count >= 8) return 90;
  if (count >= 6) return 80;
  if (count >= 4) return 70;
  if (count >= 3) return 60;
  if (count >= 2) return 40;
  return 20;
}

function getAcademicDescription(progress: number): string {
  if (progress >= 90) return "Outstanding academic profile";
  if (progress >= 75) return "Strong but needs improvement";
  if (progress >= 50) return "Good start, more progress needed";
  return "Needs significant improvement";
}

function getExtracurricularDescription(progress: number): string {
  if (progress >= 90) return "Exceptional variety of activities";
  if (progress >= 75) return "Strong involvement, good depth";
  if (progress >= 60) return "More leadership needed";
  if (progress >= 40) return "Need more activities with impact";
  return "Start building extracurricular profile";
}
