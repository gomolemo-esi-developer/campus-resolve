interface LoginLogoBadgeProps {
  logoSrc: string;
  companyName: string;
}

/**
 * Top-left login mark: white logo (no background box) + company name,
 * sized to sit over the colored login panel.
 */
export function LoginLogoBadge({ logoSrc, companyName }: LoginLogoBadgeProps) {
  return (
    <div className="fixed left-8 top-12 z-50 flex items-center gap-3">
      <img
        src={logoSrc}
        alt=""
        className="h-16 w-16 object-contain brightness-0 invert"
      />
      <span className="text-xl font-semibold tracking-tight text-background">
        {companyName}
      </span>
    </div>
  );
}

export default LoginLogoBadge;
