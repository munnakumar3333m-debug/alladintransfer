import "@/lib/auth";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { isAuthenticated } from "@/lib/auth";

import Layout from "@/components/Layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import UsersPage from "@/pages/users";
import RecommendationsPage from "@/pages/recommendations";
import AnalyticsPage from "@/pages/analytics";
import NotificationsPage from "@/pages/notifications";
import ReferralsPage from "@/pages/referrals";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  if (!isAuthenticated()) {
    navigate("/login");
    return null;
  }
  return <Layout>{children}</Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        {() => (
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/users">
        {() => (
          <ProtectedLayout>
            <UsersPage />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/recommendations">
        {() => (
          <ProtectedLayout>
            <RecommendationsPage />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/analytics">
        {() => (
          <ProtectedLayout>
            <AnalyticsPage />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/notifications">
        {() => (
          <ProtectedLayout>
            <NotificationsPage />
          </ProtectedLayout>
        )}
      </Route>
      <Route path="/referrals">
        {() => (
          <ProtectedLayout>
            <ReferralsPage />
          </ProtectedLayout>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
