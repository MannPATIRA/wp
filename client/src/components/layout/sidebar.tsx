import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  School, 
  Calendar, 
  Clock, 
  Settings, 
  LogOut, 
  User 
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function Sidebar() {
  const { user } = useUser();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await apiRequest("POST", "/api/logout");
      
      // Clear cached user data
      queryClient.setQueryData(["/api/user"], null);
      
      console.log("Logout successful, redirecting to auth page...");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Use window.location for hard navigation to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { path: "/university-goals", label: "University Goals", icon: <School className="mr-3 h-5 w-5" /> },
    { path: "/opportunities", label: "Opportunities", icon: <Calendar className="mr-3 h-5 w-5" /> },
    { path: "/timeline", label: "Timeline", icon: <Clock className="mr-3 h-5 w-5" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 h-5 w-5" /> },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-neutral-200">
      <div className="flex items-center justify-center h-16 border-b border-neutral-200">
        <h1 className="text-xl font-bold text-primary-800 font-poppins">Dream University</h1>
      </div>
      
      {/* User Profile Summary */}
      <div className="flex flex-col items-center p-4 border-b border-neutral-200">
        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 mb-2">
          <User className="h-8 w-8" />
        </div>
        <h2 className="text-sm font-semibold text-neutral-800">
          {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
        </h2>
        <p className="text-xs text-neutral-500">{user?.email}</p>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.path}>
            <Link href={item.path}>
              <div
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${
                  location === item.path
                    ? "text-white bg-primary-800"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {item.icon}
                {item.label}
              </div>
            </Link>
          </div>
        ))}
      </nav>
      
      {/* Log out button */}
      <div className="p-4 border-t border-neutral-200">
        <Button
          variant="outline"
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-neutral-700"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4 text-neutral-500" />
          Log Out
        </Button>
      </div>
    </aside>
  );
}
