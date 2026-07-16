import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const LoginForm = () => {
  const navigate = useNavigate();
  const { signin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpStaffNumber, setSignUpStaffNumber] = useState("");
  const [signUpRole, setSignUpRole] = useState("admin-staff");
  const { signup } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signInEmail || !signInPassword) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      console.log("[LoginForm] Starting signin...");
      const result = await signin(signInEmail, signInPassword);
      console.log("[LoginForm] Signin successful, result:", result);
      toast.success("Sign in successful!");
      console.log("[LoginForm] About to navigate to /");
      navigate("/", { replace: true });
      console.log("[LoginForm] Navigate called");
    } catch (error) {
      console.error("[LoginForm] Signin error:", error);
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpEmail || !signUpPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (signUpPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      await signup(signUpEmail, signUpPassword, signUpStaffNumber, "admin");
      toast.success("Admin account created successfully!");
      setActiveTab("signin");
      setSignInEmail(signUpEmail);
      setSignUpEmail("");
      setSignUpPassword("");
      setSignUpStaffNumber("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign up failed");
    }
  };

  const handleTabChange = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    setShowPassword(false);
  };

  return (
    <div className="w-full max-w-md">
      {/* Tab Switcher */}
      <div className="flex gap-8 mb-12">
        <button
          type="button"
          onClick={() => handleTabChange("signin")}
          className={`text-2xl font-bold pb-2 transition-all ${
            activeTab === "signin"
              ? "text-background border-b-4 border-background"
              : "text-background/60 hover:text-background/80"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("signup")}
          className={`text-2xl font-bold pb-2 transition-all ${
            activeTab === "signup"
              ? "text-background border-b-4 border-background"
              : "text-background/60 hover:text-background/80"
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
          <Label
            htmlFor="signInEmail"
            className="text-sm text-gray-200 uppercase"
          >
            email address
          </Label>
          <Input
            id="signInEmail"
            type="email"
            value={signInEmail}
            onChange={(e) => setSignInEmail(e.target.value)}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4 text-white placeholder:text-gray-300"
            placeholder="admin@tut.ac.za"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="signInPassword"
            className="text-sm text-gray-200 uppercase"
          >
            password
          </Label>
          <div className="relative">
            <Input
              id="signInPassword"
              type={showPassword ? "text" : "password"}
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-16 text-lg px-4 text-white placeholder:text-gray-300"
              placeholder="enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-300 hover:text-gray-200 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-password-signin"
              checked={showPassword}
              onCheckedChange={(checked) => setShowPassword(checked as boolean)}
              className="border-white"
            />
            <label
              htmlFor="show-password-signin"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-200"
            >
              show password
            </label>
          </div>
          <a
            href="#"
            className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
          >
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
          <Label
            htmlFor="signUpStaffNumber"
            className="text-sm text-gray-200 uppercase"
          >
            Staff Number (Optional)
          </Label>
          <Input
            id="signUpStaffNumber"
            type="text"
            value={signUpStaffNumber}
            onChange={(e) => setSignUpStaffNumber(e.target.value)}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-12 text-lg px-4 text-white placeholder:text-gray-300"
            placeholder="S123456"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="signUpEmail"
            className="text-sm text-gray-200 uppercase"
          >
            email address
          </Label>
          <Input
            id="signUpEmail"
            type="email"
            value={signUpEmail}
            onChange={(e) => setSignUpEmail(e.target.value)}
            className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-12 text-lg px-4 text-white placeholder:text-gray-300"
            placeholder="admin@tut.ac.za"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="signUpPassword"
            className="text-sm text-gray-200 uppercase"
          >
            password (min 8 characters)
          </Label>
          <div className="relative">
            <Input
              id="signUpPassword"
              type={showPassword ? "text" : "password"}
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              className="bg-muted/40 border-l-4 border-l-foreground border-t-0 border-r-0 border-b-0 rounded-none h-12 text-lg px-4 text-white placeholder:text-gray-300"
              placeholder="enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
    </div>
  );
};