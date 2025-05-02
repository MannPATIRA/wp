import { apiRequest } from "./queryClient";
import { InsertUser } from "@shared/schema";

export async function login(username: string, password: string) {
  try {
    const response = await apiRequest("POST", "/api/login", { username, password });
    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function register(userData: InsertUser) {
  try {
    const response = await apiRequest("POST", "/api/register", userData);
    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function logout() {
  try {
    await apiRequest("POST", "/api/logout");
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getUser() {
  try {
    const response = await apiRequest("GET", "/api/user");
    const data = await response.json();
    return { success: true, user: data };
  } catch (error) {
    return { success: false, error };
  }
}
