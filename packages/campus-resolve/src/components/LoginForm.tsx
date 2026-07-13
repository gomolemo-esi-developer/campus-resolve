import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@shared/contexts/AuthContext";

export const LoginForm = () => {
  const navigate = useNavigate();
  const { signin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign In state
   const [signInEmail, setSignInEmail] = useState("");
   const [signInStaffNumber, setSignInStaffNumber] = useState("");
   const [signInPassword, setSignInPassword] = useState("");
   
   // Sign Up state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpFirstName, setSignUpFirstName] = useState("");
  const [signUpLastName, setSignUpLastName] = useState("");
  const [signUpStaffNumber, setSignUpStaffNumber] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  
  // Confirmation state
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  
  const { signup } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation - only email+password sent to backend
    if (!signInEmail || !signInPassword) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      // Call backend API /api/auth/signin with email and password only
      await signin(signInEmail, signInPassword);
      toast.success("Sign in successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signUpEmail || !signUpPassword || !signUpFirstName || !signUpLastName || !signUpStaffNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    if (signUpPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      await signup(signUpEmail, signUpPassword, signUpFirstName, signUpLastName, signUpStaffNumber, "staff", "resolve");

      toast.success("Staff account created successfully! You can now sign in.");
      setActiveTab("signin");
      setSignInEmail(signUpEmail);
      setSignUpEmail("");
      setSignUpFirstName("");
      setSignUpLastName("");
      setSignUpStaffNumber("");
      setSignUpPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign up failed");
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmEmail || !confirmCode) {
      toast.error("Please enter email and confirmation code");
      return;
    }

    try {
      // Call the confirmSignup endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8086'}/api/auth/cognito/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: confirmEmail, confirmationCode: confirmCode }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Confirmation failed');
      }

      toast.success("Email confirmed! You can now sign in.");
      setActiveTab("signin");
      setSignInEmail(confirmEmail);
      setConfirmEmail("");
      setConfirmCode("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Confirmation failed");
    }
  };

  const handleTabChange = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    setShowPassword(false);
  };

  return (
    <div className="w-full max-w-md">
      {/* Tab Switcher */}
      <div className="flex gap-4 mb-8">
        <button
          type="button"
          onClick={() => handleTabChange("signin")}
          className={`pb-2 text-lg font-medium transition-all ${
            activeTab === "signin" 
              ? "text-foreground border-b-2 border-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("signup")}
          className={`pb-2 text-lg font-medium transition-all ${
            activeTab === "signup" 
              ? "text-foreground border-b-2 border-foreground" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Sign In Form */}
      <form 
        onSubmit={handleSignIn} 
        className={`space-y-6 ${activeTab === "signin" ? "block" : "hidden"}`}
      >
        <div className="space-y-2">
          <Label htmlFor="signInEmail" className="text-sm text-muted-foreground uppercase">
            email / staff number
          </Label>
          <Input
            id="signInEmail"
            type="text"
            value={signInEmail}
            onChange={(e) => setSignInEmail(e.target.value)}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4"
            placeholder="staff@tut.ac.za or S12345678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signInPassword" className="text-sm text-muted-foreground uppercase">
            password
          </Label>
          <div className="relative">
            <Input
              id="signInPassword"
              type={showPassword ? "text" : "password"}
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4"
              placeholder="enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-password-signin"
              checked={showPassword}
              onCheckedChange={(checked) => setShowPassword(checked as boolean)}
            />
            <label
              htmlFor="show-password-signin"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              show password
            </label>
          </div>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            forgot password
          </a>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 rounded-md text-lg font-medium disabled:opacity-50"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      {/* Sign Up Form */}
      <form 
        onSubmit={handleSignUp} 
        className={`space-y-6 ${activeTab === "signup" ? "block" : "hidden"}`}
      >
        <div className="space-y-2">
          <Label htmlFor="signUpEmail" className="text-sm text-muted-foreground uppercase">
            email address
          </Label>
          <Input
            id="signUpEmail"
            type="email"
            value={signUpEmail}
            onChange={(e) => setSignUpEmail(e.target.value)}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4"
            placeholder="staff@tut.ac.za"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signUpFirstName" className="text-sm text-muted-foreground uppercase">
            first name
          </Label>
          <Input
            id="signUpFirstName"
            type="text"
            value={signUpFirstName}
            onChange={(e) => setSignUpFirstName(e.target.value)}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4"
            placeholder="John"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signUpLastName" className="text-sm text-muted-foreground uppercase">
            last name
          </Label>
          <Input
            id="signUpLastName"
            type="text"
            value={signUpLastName}
            onChange={(e) => setSignUpLastName(e.target.value)}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4"
            placeholder="Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signUpStaffNumber" className="text-sm text-muted-foreground uppercase">
            staff number
          </Label>
          <Input
            id="signUpStaffNumber"
            type="text"
            value={signUpStaffNumber}
            onChange={(e) => setSignUpStaffNumber(e.target.value)}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4"
            placeholder="S12345678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="signUpPassword" className="text-sm text-muted-foreground uppercase">
            password (min 8 characters)
          </Label>
          <div className="relative">
            <Input
              id="signUpPassword"
              type={showPassword ? "text" : "password"}
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4"
              placeholder="enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 rounded-md text-lg font-medium disabled:opacity-50"
        >
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>

      {/* Confirmation Form */}
      <form
        onSubmit={handleConfirm}
        className={`space-y-6 ${activeTab === "confirm" ? "block" : "hidden"}`}
      >
        <p className="text-sm text-gray-300 mb-4">
          Check your email for a verification code and enter it below.
        </p>

        <div className="space-y-2">
          <Label htmlFor="confirmEmail" className="text-sm text-gray-200 uppercase">
            email address
          </Label>
          <Input
            id="confirmEmail"
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4 placeholder:text-gray-400"
            placeholder="your.email@tut.ac.za"
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmCode" className="text-sm text-gray-200 uppercase">
            verification code
          </Label>
          <Input
            id="confirmCode"
            type="text"
            value={confirmCode}
            onChange={(e) => setConfirmCode(e.target.value.toUpperCase())}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4 placeholder:text-gray-400 tracking-widest"
            placeholder="000000"
            maxLength="6"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 rounded-md text-lg font-medium disabled:opacity-50"
        >
          {isLoading ? "Confirming..." : "Confirm Email"}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Didn't receive the code?{" "}
          <button
            type="button"
            className="text-gray-200 hover:text-gray-100 underline"
            onClick={() => toast.info("Check your email or contact support")}
          >
            Resend Code
          </button>
        </p>
      </form>
    </div>
  );
};
