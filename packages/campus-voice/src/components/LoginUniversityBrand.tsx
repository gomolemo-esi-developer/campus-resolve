interface LoginUniversityBrandProps {
  logoSrc: string;
  text: string;
}

/**
 * Bottom-left login mark: university logo + branding text, same font
 * treatment as the top-left company name but in light grey.
 */
export function LoginUniversityBrand({
  logoSrc,
  text,
}: LoginUniversityBrandProps) {
  return (
    <div className="fixed bottom-10 left-8 z-50 flex items-center gap-3">
      <img src={logoSrc} alt="" className="h-6 w-6 object-contain opacity-40" />
      <span className="text-base font-light text-zinc-400">{text}</span>
    </div>
  );
}

export default LoginUniversityBrand;
