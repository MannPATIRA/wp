import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import OpportunityDetailPage from "@/pages/opportunity-detail-page";
import ProfilePage from "@/pages/profile-page";
import UniversityGoalsPage from "@/pages/university-goals-page";
import TimelinePage from "@/pages/timeline-page";
import OpportunitiesPage from "@/pages/opportunities-page";
import SettingsPage from "@/pages/settings-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/opportunity/:id" component={OpportunityDetailPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/university-goals" component={UniversityGoalsPage} />
      <ProtectedRoute path="/timeline" component={TimelinePage} />
      <ProtectedRoute path="/opportunities" component={OpportunitiesPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <AuthProvider>
        <Router />
      </AuthProvider>
      <Toaster />
    </>
  );
}

export default App;
