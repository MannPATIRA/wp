import { Card, CardContent } from "@/components/ui/card";
import { Notification } from "@shared/schema";
import { BellRing, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface NotificationPanelProps {
  notifications: Notification[];
  className?: string;
}

export function NotificationPanel({ notifications, className }: NotificationPanelProps) {
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Function to get icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case "opportunity":
        return <BellRing className="text-primary-500 mr-3" />;
      case "deadline":
        return <Calendar className="text-neutral-500 mr-3" />;
      case "recommendation":
        return <Award className="text-secondary-500 mr-3" />;
      default:
        return <BellRing className="text-primary-500 mr-3" />;
    }
  };

  // Function to get class based on notification type
  const getTypeClass = (type: string) => {
    switch (type) {
      case "opportunity":
        return "bg-primary-50 border-l-4 border-primary-500 rounded-r-md";
      case "deadline":
        return "bg-neutral-50 border-l-4 border-neutral-400 rounded-r-md";
      case "recommendation":
        return "bg-secondary-50 border-l-4 border-secondary-500 rounded-r-md";
      default:
        return "bg-primary-50 border-l-4 border-primary-500 rounded-r-md";
    }
  };

  return (
    <Card className={cn("shadow-sm border border-neutral-200", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-800 font-poppins">Notifications</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {unreadCount} new
            </span>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 p-4 bg-neutral-50 rounded-md">
            <BellRing className="h-10 w-10 text-neutral-300 mb-2" />
            <p className="text-neutral-500 text-center">No notifications yet</p>
            <p className="text-neutral-400 text-sm text-center mt-1">
              Notifications about opportunities and deadlines will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className={`flex p-3 ${getTypeClass(notification.type)}`}>
                {getIcon(notification.type)}
                <div>
                  <p className="text-sm font-medium text-neutral-900">{notification.title}</p>
                  <p className="text-xs text-neutral-600 mt-1">{notification.message}</p>
                </div>
              </div>
            ))}
            
            {notifications.length > 3 && (
              <Button 
                variant="link" 
                className="mt-2 text-sm text-primary-700 font-medium hover:text-primary-800"
                asChild
              >
                <Link href="/notifications">
                  View all notifications
                  <span className="material-icons text-sm ml-1">arrow_forward</span>
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
