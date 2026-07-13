import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@shared/contexts/AuthContext";
import { toast } from "sonner";
import "./Login.css";

/*
 * Form transition animation inspired by:
 * @author Alberto Hartzet
 * Licence (CC BY-NC-SA 4.0) http://creativecommons.org/licenses/by-nc-sa/4.0/
 */

const Login = () => {
  const navigate = useNavigate();
  const { signin, signup, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign In form state
   const [signInEmail, setSignInEmail] = useState("");
   const [signInPassword, setSignInPassword] = useState("");

   // Sign Up form state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpFirstName, setSignUpFirstName] = useState("");
  const [signUpLastName, setSignUpLastName] = useState("");
  const [signUpStudentNumber, setSignUpStudentNumber] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signInEmail || !signInPassword) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      await signin(signInEmail, signInPassword);
      toast.success("Sign in successful!");
      navigate("/messages");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpEmail || !signUpPassword || !signUpFirstName || !signUpLastName || !signUpStudentNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await signup(signUpEmail, signUpPassword, signUpFirstName, signUpLastName, signUpStudentNumber, "student", "voice");
      toast.success("Sign up successful!");
      navigate("/messages");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign up failed");
    }
  };

  const handleTabChange = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    setShowPassword(false);
  };

  return (
     <div className="min-h-screen flex flex-col md:flex-row">
       {/* Logo Section - Left side on Desktop (white background) */}
      <div className="hidden md:flex md:w-[25%] bg-background items-center justify-center relative overflow-hidden">
        <div className="ripple-container ripple-light">
          <div className="ripple ripple1"></div>
          <div className="ripple ripple2"></div>
          <div className="ripple ripple3"></div>
        </div>
        <GraduationCap className="h-16 w-16 text-foreground relative z-10" />
      </div>

      {/* Form Section - Right side on Desktop, Full on Mobile */}
      <div className="flex-1 bg-primary flex flex-col min-h-screen md:min-h-0">
        {/* App Header - Top */}
        <div className="px-8 md:px-16 lg:px-24 pt-12">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-primary-foreground/20 p-2 rounded-lg relative overflow-hidden">
              <div className="ripple-container ripple-dark md:hidden">
                <div className="ripple ripple1"></div>
                <div className="ripple ripple2"></div>
                <div className="ripple ripple3"></div>
              </div>
              <GraduationCap className="h-8 w-8 text-primary-foreground relative z-10" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground tracking-wide">STUDENTSYNC</h1>
              <p className="text-primary-foreground/60 text-sm">complaint portal</p>
            </div>
          </div>
        </div>

        {/* Main Form Area - Center */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 md:max-w-[60%] mx-auto w-full">
          {/* Tab Switcher - Text Based */}
          <div className="flex gap-6 mb-8">
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className={`text-2xl font-semibold transition-all duration-300 ${
                activeTab === "signup" 
                  ? "text-primary-foreground" 
                  : "text-primary-foreground/40"
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("signin")}
              className={`text-2xl font-semibold transition-all duration-300 ${
                activeTab === "signin" 
                  ? "text-primary-foreground" 
                  : "text-primary-foreground/40"
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Forms Container with Animation */}
          <div className="relative overflow-hidden">
            {/* Sign In Form */}
            <form 
              onSubmit={handleSignIn} 
              className={`space-y-4 transition-all duration-700 ${
                activeTab === "signin" 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
              }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              <Input
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="h-14 bg-black/50 border-0 rounded-2xl text-primary-foreground placeholder:text-primary-foreground/50 px-5 !ring-0 !focus-visible:ring-0 !focus-visible:ring-offset-0"
                placeholder="enter email, student number or staff number"
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="h-14 bg-black/50 border-0 rounded-2xl text-primary-foreground placeholder:text-primary-foreground/50 px-5 pr-16 !ring-0 !focus-visible:ring-0 !focus-visible:ring-offset-0"
                  placeholder="enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </form>

            {/* Sign Up Form */}
            <form 
              onSubmit={handleSignUp} 
              className={`space-y-4 transition-all duration-700 ${
                activeTab === "signup" 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
              }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              <Input
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                className="h-14 bg-black/50 border-0 rounded-2xl text-primary-foreground placeholder:text-primary-foreground/50 px-5 !ring-0 !focus-visible:ring-0 !focus-visible:ring-offset-0"
                placeholder="enter email"
              />
              <Input
                type="text"
                value={signUpFirstName}
                onChange={(e) => setSignUpFirstName(e.target.value)}
                className="h-14 bg-black/50 border-0 rounded-2xl text-primary-foreground placeholder:text-primary-foreground/50 px-5 !ring-0 !focus-visible:ring-0 !focus-visible:ring-offset-0"
                placeholder="enter first name"
              />
              <Input
                type="text"
                value={signUpLastName}
                onChange={(e) => setSignUpLastName(e.target.value)}
                className="h-14 bg-black/50 border-0 rounded-2xl text-primary-foreground placeholder:text-primary-foreground/50 px-5 !ring-0 !focus-visible:ring-0 !focus-visible:ring-offset-0"
                placeholder="enter last name"
              />
              <Input
                type="text"
                value={signUpStudentNumber}
                onChange={(e) => setSignUpStudentNumber(e.target.value)}
                className="h-14 bg-black/50 border-0 rounded-2xl text-primary-foreground placeholder:text-primary-foreground/50 px-5 !ring-0 !focus-visible:ring-0 !focus-visible:ring-offset-0"
                placeholder="enter student number or staff number"
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="h-14 bg-black/50 border-0 rounded-2xl text-primary-foreground placeholder:text-primary-foreground/50 px-5 pr-16 !ring-0 !focus-visible:ring-0 !focus-visible:ring-offset-0"
                  placeholder="enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Submit Button - Bottom */}
        <div className="px-8 md:px-16 lg:px-24 pb-12 flex justify-center">
          <Button
            type="submit"
            onClick={activeTab === "signin" ? handleSignIn : handleSignUp}
            disabled={isLoading}
            className="w-60 px-8 h-12 bg-primary-foreground text-foreground hover:bg-primary-foreground/90 rounded-md text-sm font-semibold uppercase tracking-wider disabled:opacity-50"
          >
            {isLoading ? "LOADING..." : (activeTab === "signin" ? "SIGN IN" : "SIGN UP")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
