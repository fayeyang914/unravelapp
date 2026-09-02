import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Compose from "./pages/Compose";
import History from "./pages/History";
import EntryDetail from "./pages/EntryDetail";
import Insights from "./pages/Insights";
import Reading from "./pages/Reading";
import Impact from "./pages/Impact";

import SettingsPage from "./pages/Settings";
import Breathe from "./pages/Breathe";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";
import LockGate from "./components/LockGate";
import { AuthProvider, useAuth } from "@/lib/auth";
import { applyAppearance, useSettings } from "@/lib/store";

const queryClient = new QueryClient();

const Appearance = () => {
  const { settings } = useSettings();
  useEffect(() => applyAppearance(settings), [settings]);
  return null;
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!session) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <LockGate>{children}</LockGate>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Appearance />
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/write" element={<Compose />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/entry/:id" element={<EntryDetail />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/reading" element={<Reading />} />
                    <Route path="/impact" element={<Impact />} />

                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/breathe" element={<Breathe />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
