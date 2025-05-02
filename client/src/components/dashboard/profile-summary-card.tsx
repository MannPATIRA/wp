import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserProfile } from "@shared/schema";
import { User, Edit } from "lucide-react";
import { Link } from "wouter";

interface ProfileSummaryCardProps {
  profile?: UserProfile;
  user?: any; // User from auth context
}

export function ProfileSummaryCard({ profile, user }: ProfileSummaryCardProps) {
  return (
    <Card className="shadow-sm border border-neutral-200">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="flex-shrink-0 mr-5">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 mb-2">
              <User className="h-10 w-10" />
            </div>
          </div>
          <div className="flex-1 md:grid md:grid-cols-3 gap-4 mt-4 md:mt-0">
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Personal</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">Name:</span> {user ? `${user.firstName} ${user.lastName}` : "N/A"}
                </p>
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">Age:</span> {profile?.age || "Not specified"}
                </p>
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">Grade:</span> {profile?.grade || "Not specified"}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Academics</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">GPA:</span> {profile?.gpa || "Not specified"}
                </p>
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">SAT:</span> {profile?.sat || "Not specified"}
                </p>
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">AP Courses:</span> {profile?.apCourses || "Not specified"}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Target</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">University:</span> {profile?.targetUniversity || "Not specified"}
                </p>
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">Major:</span> {profile?.targetMajor || "Not specified"}
                </p>
                <p className="text-sm text-neutral-800">
                  <span className="font-medium">Application Deadline:</span> {profile?.applicationDeadline 
                    ? new Date(profile.applicationDeadline).toLocaleDateString() 
                    : "Not specified"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 md:ml-4">
            <Link href="/profile">
              <Button className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700">
                <Edit className="h-4 w-4 mr-1" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
