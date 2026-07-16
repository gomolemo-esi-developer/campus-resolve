interface LoginUniversityBrandProps {
  logoSrc: string;
  text: string;
}

/**
 * Bottom-left login mark: university logo + branding text, both white.
 */
export function LoginUniversityBrand({
  logoSrc,
  text,
}: LoginUniversityBrandProps) {
  return (
    <div className="fixed bottom-10 left-8 z-50 flex items-center gap-3">
      <img
        src={logoSrc}
        alt=""
        className="h-8 w-8 object-contain brightness-0 invert"
      />
      <span className="text-base font-normal text-background">{text}</span>
    </div>
  );
}

export default LoginUniversityBrand;
