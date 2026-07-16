import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@shared/contexts/AuthContext";
import { toast } from "sonner";
import { LoginLogoBadge } from "@/components/LoginLogoBadge";
import { LoginUniversityBrand } from "@/components/LoginUniversityBrand";
import companyLogo from "@/assets/Company Logo 1.png";
import universityLogo from "@/assets/TUT Icon.png";
import "./Login.css";

/*
 * Form transition animation inspired by:
 * @author Alberto Hartzet
 * Licence (CC BY-NC-SA 4.0) http://creativecommons.org/licenses/by-nc-sa/4.0/
 */

const steps: {
  n: number;
  pos: "top" | "right" | "bottom" | "left";
  label: string;
}[] = [
  { n: 1, pos: "top", label: "Report" },
  { n: 2, pos: "right", label: "Track" },
  { n: 3, pos: "bottom", label: "Respond" },
  { n: 4, pos: "left", label: "Resolve" },
];

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

    if (!signUpEmail || !signUpPassword || !signUpStudentNumber) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await signup(
        signUpEmail,
        signUpPassword,
        signUpStudentNumber,
        "student",
        "voice",
      );
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      <LoginLogoBadge logoSrc={companyLogo} companyName="TUT Resolve" />
      <LoginUniversityBrand
        logoSrc={universityLogo}
        text="Official Product of TUT"
      />
      {/* Animation Section - Left side, 40/60 on desktop, shown on mobile too */}
      <section className="relative flex min-h-[640px] w-full flex-col overflow-hidden bg-neutral-50 lg:min-h-screen lg:w-2/5">
        <div className="flex flex-1 flex-col items-center justify-center gap-24 px-8 pt-24 pb-24 sm:pt-28 lg:pt-32">
          <div className="relative flex h-[420px] w-[420px] items-center justify-center">
            {/* Center icon */}
            <div className="z-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#FF0000] text-white">
                <GraduationCap className="size-6" strokeWidth={2.2} />
              </div>
            </div>

            {/* Rings */}
            <div className="absolute size-[150px] rounded-full border border-[#FF0000]/10" />
            <div className="absolute size-[240px] rounded-full border border-[#FF0000]/10" />
            <div className="absolute size-[330px] rounded-full border border-[#FF0000]/10" />
            <div className="absolute size-[420px] rounded-full border border-[#FF0000]/10" />

            {/* Orbiting dots */}
            <div className="ss-dot ss-r1" />
            <div className="ss-dot ss-r2" />
            <div className="ss-dot ss-r3" />
            <div className="ss-dot ss-r4" />

            {/* Step labels */}
            {steps.map((s) => {
              const cls =
                s.pos === "top"
                  ? "-top-12 left-1/2 -translate-x-1/2 items-center"
                  : s.pos === "right"
                    ? "top-1/2 -right-12 -translate-y-1/2 items-start"
                    : s.pos === "bottom"
                      ? "-bottom-12 left-1/2 -translate-x-1/2 items-center"
                      : "top-1/2 -left-12 -translate-y-1/2 items-end";
              return (
                <div key={s.n} className={`absolute flex flex-col ${cls}`}>
                  <span className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-black">
                    Step {s.n}
                  </span>
                  <span className="bg-neutral-50 px-2 text-sm font-light text-zinc-400">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Text Card */}
          {/* <div className="w-full rounded-2xl bg-white p-8 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.15)]">
            <h2 className="font-serif text-2xl leading-tight text-zinc-900 lg:text-3xl">
              A clear path from grievance to formal resolution.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              StudentSync ensures every formal complaint follows a structured,
              transparent process. From initial submission to final
              verification, we keep you informed at every milestone.
            </p>
          </div> */}
        </div>
      </section>

      {/* Form Section - Right side, 40/60 on desktop, full width on mobile */}
      <div className="w-full lg:w-3/5 bg-primary flex flex-col min-h-screen lg:min-h-0">
        {/* App Header - Top */}
        <div className="px-8 md:px-16 lg:px-24 pt-12">
          <div className="flex items-center justify-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-primary-foreground tracking-wide">
                CAMPUS VOICE
              </h1>
              <p className="text-primary-foreground/60 text-sm">
                complaint portal
              </p>
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
              style={{
                transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
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
              style={{
                transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
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
            {isLoading
              ? "LOADING..."
              : activeTab === "signin"
                ? "SIGN IN"
                : "SIGN UP"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
