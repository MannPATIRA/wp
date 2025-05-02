import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  School, 
  Calendar, 
  Clock, 
  Settings, 
  LogOut, 
  User,
  Bell 
} from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function MobileMenu({ isOpen, onClose, onOpen }: MobileMenuProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [location] = useLocation();
  const [overlayVisible, setOverlayVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setOverlayVisible(true);
      document.body.classList.add("overflow-hidden");
    } else {
      setTimeout(() => {
        setOverlayVisible(false);
      }, 300); // Match the duration in the transition classes
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      window.location.href = '/auth';
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging you out.",
        variant: "destructive",
      });
    }
    onClose();
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 text-xl" /> },
    { path: "/university-goals", label: "University Goals", icon: <School className="mr-3 text-xl" /> },
    { path: "/opportunities", label: "Opportunities", icon: <Calendar className="mr-3 text-xl" /> },
    { path: "/timeline", label: "Timeline", icon: <Clock className="mr-3 text-xl" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 text-xl" /> },
  ];

  return (
    <>
      {/* Mobile header */}
      <header className="bg-white border-b border-neutral-200 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpen}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-neutral-600" />
          </Button>
          <h1 className="text-lg font-bold text-primary-800 font-poppins">Dream University</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpen}
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6 text-neutral-600" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {overlayVisible && (
        <div 
          className={`fixed inset-0 bg-neutral-900 bg-opacity-50 z-40 md:hidden ${
            isOpen ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile Menu Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-white z-50 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="flex items-center justify-between h-16 border-b border-neutral-200 px-4">
          <h1 className="text-lg font-bold text-primary-800 font-poppins">Dream University</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-neutral-600" />
          </Button>
        </div>
        
        {/* Mobile User Profile Summary */}
        <div className="flex flex-col items-center p-4 border-b border-neutral-200">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 mb-2">
            <User className="h-8 w-8" />
          </div>
          <h2 className="text-sm font-semibold text-neutral-800">
            {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
          </h2>
          <p className="text-xs text-neutral-500">{user?.email}</p>
        </div>
        
        {/* Mobile Navigation Links */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  location === item.path
                    ? "text-white bg-primary-800"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
                onClick={onClose}
              >
                {item.icon}
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
        
        {/* Mobile Log out button */}
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
      </div>
    </>
  );
}
