import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import "./Login.css";

const steps: { n: number; pos: "top" | "right" | "bottom" | "left"; label: string }[] = [
  { n: 1, pos: "top", label: "Report" },
  { n: 2, pos: "right", label: "Track" },
  { n: 3, pos: "bottom", label: "Respond" },
  { n: 4, pos: "left", label: "Resolve" },
];

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="relative flex items-center justify-center">
        {/* Center icon */}
        <div className="z-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex size-12 items-center justify-center rounded-lg bg-[#FF0000] text-white">
            <GraduationCap className="size-6" strokeWidth={2.2} />
          </div>
        </div>

        {/* Rings */}
        <div className="absolute size-[170px] rounded-full border border-[#FF0000]/10" />
        <div className="absolute size-[270px] rounded-full border border-[#FF0000]/10" />
        <div className="absolute size-[370px] rounded-full border border-[#FF0000]/10" />
        <div className="absolute size-[470px] rounded-full border border-[#FF0000]/10" />

        {/* Orbiting dots */}
        <div className="ss-dot ss-r1" />
        <div className="ss-dot ss-r2" />
        <div className="ss-dot ss-r3" />
        <div className="ss-dot ss-r4" />

        {/* Step labels */}
        {steps.map((s) => {
          const cls =
            s.pos === "top"
              ? "-top-16 left-1/2 -translate-x-1/2 items-center"
              : s.pos === "right"
              ? "top-1/2 -right-28 -translate-y-1/2 items-start"
              : s.pos === "bottom"
              ? "-bottom-16 left-1/2 -translate-x-1/2 items-center"
              : "top-1/2 -left-28 -translate-y-1/2 items-end";
          return (
            <div key={s.n} className={`absolute flex flex-col ${cls}`}>
              <span className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-black">
                Step {s.n}
              </span>
              <span className="bg-neutral-50 px-2 text-sm font-medium text-zinc-500">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Splash;
