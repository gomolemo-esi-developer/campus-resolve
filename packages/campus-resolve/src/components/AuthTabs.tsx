import { useState } from "react";

export const AuthTabs = () => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  return (
    <div className="flex gap-8 mb-12">
      <button
        onClick={() => setActiveTab("login")}
        className={`text-2xl font-bold pb-2 transition-all ${
          activeTab === "login"
            ? "text-background border-b-4 border-background"
            : "text-background/60 hover:text-background/80"
        }`}
      >
        Login
      </button>
      <button
        onClick={() => setActiveTab("register")}
        className={`text-2xl font-bold pb-2 transition-all ${
          activeTab === "register"
            ? "text-background border-b-4 border-background"
            : "text-background/60 hover:text-background/80"
        }`}
      >
        Register
      </button>
    </div>
  );
};
