interface LoginLogoBadgeProps {
  logoSrc: string;
  companyName: string;
}

/**
 * Top-left login mark: logo on a black rounded card with a soft shadow,
 * followed by the company name. Height matches the STUDENTSYNC header icon
 * box on the form panel (h-12) so the two align vertically at the same
 * top offset (top-12 here, pt-12 on the header).
 */
export function LoginLogoBadge({ logoSrc, companyName }: LoginLogoBadgeProps) {
  return (
    <div className="fixed left-8 top-12 z-50 flex items-center gap-3">
      <div className="flex items-center justify-center rounded-2xl bg-[#1a1a1a] shadow-lg shadow-black/30 p-1">
        <img src={logoSrc} alt="" className="h-12 w-12 object-contain" />
      </div>
      <span className="text-xl font-semibold tracking-tight text-zinc-900">{companyName}</span>
    </div>
  );
}

export default LoginLogoBadge;
