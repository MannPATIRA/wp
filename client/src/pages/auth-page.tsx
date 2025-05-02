import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { School } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema based on the user schema
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to dashboard");
      navigate("/");
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      console.log('Attempting login with:', data.username);
      
      const response = await apiRequest('POST', '/api/login', data);
      const user = await response.json();
      
      console.log('Login success, user data:', user);
      
      // Update the cached user data
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName}!`,
      });
      
      // Force a hard navigation to ensure session is properly recognized
      console.log('Redirecting to dashboard with full page load...');
      window.location.href = "/";
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      console.log('Attempting registration with:', data.username);
      // Omit confirmPassword as it's not part of the InsertUser type
      const { confirmPassword, ...userData } = data;
      
      const response = await apiRequest('POST', '/api/register', userData);
      const user = await response.json();
      
      console.log('Registration success, user data:', user);
      
      // Update the cached user data
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.firstName}!`,
      });
      
      // Force a hard navigation to ensure session is properly recognized
      console.log('Redirecting to dashboard with full page load...');
      window.location.href = "/";
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Return early if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6 items-center">
        {/* Hero section */}
        <div className="bg-primary-800 text-white p-10 rounded-lg hidden md:block">
          <div className="flex items-center mb-6">
            <School className="h-10 w-10 mr-3" />
            <h1 className="text-3xl font-bold font-poppins">Dream University Navigator</h1>
          </div>
          <h2 className="text-xl font-semibold mb-4">Plan your path to top universities</h2>
          <p className="mb-6">
            Our platform helps high school students like you prepare for admission to Ivy League 
            and Russell Group universities through personalized recommendations and opportunities.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary-700 p-2 rounded-full mr-3">
                <School className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Personalized Recommendations</h3>
                <p className="text-sm opacity-90">
                  Get activities and opportunities tailored to your target university and course.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-700 p-2 rounded-full mr-3">
                <School className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Track Your Progress</h3>
                <p className="text-sm opacity-90">
                  Monitor your readiness with our dashboard and timeline features.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary-700 p-2 rounded-full mr-3">
                <School className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium">Stay Updated</h3>
                <p className="text-sm opacity-90">
                  Receive notifications about new opportunities and application deadlines.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth forms */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary-800">
              {activeTab === "login" ? "Welcome Back" : "Create Your Account"}
            </CardTitle>
            <CardDescription>
              {activeTab === "login" 
                ? "Sign in to continue your university preparation journey" 
                : "Join thousands of students planning their university journey"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a secure password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-neutral-600">
            {activeTab === "login" ? (
              <p>Don't have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("register")}>Register</Button></p>
            ) : (
              <p>Already have an account? <Button variant="link" className="p-0 h-auto" onClick={() => setActiveTab("login")}>Login</Button></p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
