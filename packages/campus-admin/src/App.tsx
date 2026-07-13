import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Campus from "./pages/Campus";
import Course from "./pages/Course";
import Department from "./pages/Department";
import Faculty from "./pages/Faculty";
import Module from "./pages/Module";
import Profile from "./pages/Profile";
import Roles from "./pages/Roles";
import Staff from "./pages/Staff";
import Students from "./pages/Students";
import Extracurricular from "./pages/Extracurricular";
import Residence from "./pages/Residence";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import { AuthProvider } from "@shared/contexts/AuthContext";
import ProtectedRoute from "@shared/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/admin">
          <Routes>
            <Route path="/login" element={<Index />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/campus" element={<Campus />} />
                      <Route path="/course" element={<Course />} />
                      <Route path="/department" element={<Department />} />
                      <Route path="/faculty" element={<Faculty />} />
                      <Route path="/module" element={<Module />} />
                      <Route path="/extracurricular" element={<Extracurricular />} />
                      <Route path="/roles" element={<Roles />} />
                      <Route path="/staff" element={<Staff />} />
                      <Route path="/students" element={<Students />} />
                      <Route path="/residence" element={<Residence />} />
                      <Route path="/profile" element={<Profile />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
