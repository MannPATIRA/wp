import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useUser() {
  const { toast } = useToast();
  
  const { 
    data: user, 
    isLoading,
    error,
    refetch 
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchOnWindowFocus: false,
    retry: 1,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      return res;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      // Redirect to auth page with full page reload
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    user,
    isLoading,
    error,
    refetch,
    logoutMutation
  };
}