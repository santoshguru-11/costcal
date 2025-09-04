import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear the auth query cache
      queryClient.setQueryData(["/api/auth/user"], null);
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refetch,
  };
}