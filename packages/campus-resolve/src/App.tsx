import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@shared/contexts/AuthContext";
import ProtectedRoute from "@shared/components/ProtectedRoute";
import Index from "./pages/Index";
import Complaints from "./pages/Complaints";
import Profile from "./pages/Profile";
import QuickNotes from "./pages/QuickNotes";
import NotFound from "./pages/NotFound";
import { ConversationsProvider } from "./contexts/ConversationsContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ConversationsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename="/resolve">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Index />} />
<Route
                 path="/*"
                 element={
                   <ProtectedRoute requiredRoles={["staff"]}>
<Routes>
                        <Route path="/complaints" element={<Complaints />} />
                        <Route path="/dashboard" element={<Navigate to="/complaints" replace />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/notes" element={<QuickNotes />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                   </ProtectedRoute>
                 }
               />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ConversationsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
