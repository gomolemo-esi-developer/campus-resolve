import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import "./Splash.css";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 5000);// 5 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary">
      <div className="animate-fade-in relative w-32 h-32">
        <div className="ripple-container ripple-splash">
          <div className="ripple ripple1"></div>
          <div className="ripple ripple2"></div>
          <div className="ripple ripple3"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <GraduationCap className="h-32 w-32 text-foreground" />
        </div>
      </div>
    </div>
  );
};

export default Splash;
