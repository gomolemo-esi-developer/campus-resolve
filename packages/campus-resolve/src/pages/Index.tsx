import { LoginForm } from "@/components/LoginForm";
import { BrandingSection } from "@/components/BrandingSection";

const Index = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 bg-secondary flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">          
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-background">Welcome back</h2>
            <p className="text-background/90 text-lg">Complaint App - Receptionist Portal</p>
          </div>

          <LoginForm />
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-background">
        <BrandingSection />
      </div>
    </div>
  );
};

export default Index;
