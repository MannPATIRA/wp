import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { useUser } from "@/hooks/use-user";
import { useMutation } from "@tanstack/react-query";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Bell, Eye, EyeOff, Shield, LogOut } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Account form schema
const accountFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

// Password form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Notification form schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  applicationDeadlines: z.boolean(),
  newOpportunities: z.boolean(),
  recommendationUpdates: z.boolean(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function SettingsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, logoutMutation } = useUser();
  const { toast } = useToast();
  
  // Account form
  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
    values: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      applicationDeadlines: true,
      newOpportunities: true,
      recommendationUpdates: true,
    },
  });

  // Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: async (data: AccountFormValues) => {
      const response = await apiRequest("PATCH", "/api/user", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Account updated",
        description: "Your account information has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating account",
        description: error.message || "There was an error updating your account",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const response = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating password",
        description: error.message || "There was an error updating your password",
        variant: "destructive",
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      const response = await apiRequest("POST", "/api/user/notification-settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating notification settings",
        description: error.message || "There was an error updating your notification settings",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const onAccountSubmit = (data: AccountFormValues) => {
    updateAccountMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };

  const onNotificationSubmit = (data: NotificationFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

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
            <h1 className="text-2xl font-bold text-neutral-900 font-poppins mb-6">Settings</h1>
            
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              
              {/* Account Settings */}
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Account Information
                    </CardTitle>
                    <CardDescription>
                      Update your account details and personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...accountForm}>
                      <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={accountForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={accountForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={accountForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateAccountMutation.isPending}
                          >
                            {updateAccountMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-600">
                      <LogOut className="h-5 w-5 mr-2" />
                      Log Out
                    </CardTitle>
                    <CardDescription>
                      Log out of your account on this device
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      {logoutMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging Out...
                        </>
                      ) : "Log Out"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Password Settings */}
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Change Password
                    </CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input 
                                    type={showPassword ? "text" : "password"} 
                                    {...field} 
                                  />
                                </FormControl>
                                <Button 
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type={showPassword ? "text" : "password"} 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updatePasswordMutation.isPending}
                          >
                            {updatePasswordMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : "Update Password"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notification Settings */}
              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>
                      Control how you receive notifications and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationForm}>
                      <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                        <FormField
                          control={notificationForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Email Notifications</FormLabel>
                                <FormDescription>
                                  Receive notifications via email
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <Separator />
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium">Notification Types</h3>
                          
                          <FormField
                            control={notificationForm.control}
                            name="applicationDeadlines"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Application Deadlines</FormLabel>
                                  <FormDescription>
                                    Get notified about upcoming application deadlines
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="newOpportunities"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>New Opportunities</FormLabel>
                                  <FormDescription>
                                    Get notified about new opportunities matching your profile
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationForm.control}
                            name="recommendationUpdates"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Recommendation Updates</FormLabel>
                                  <FormDescription>
                                    Get notified when new recommendations are generated
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={updateNotificationsMutation.isPending}
                          >
                            {updateNotificationsMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : "Save Preferences"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
