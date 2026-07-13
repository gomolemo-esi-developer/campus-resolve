import tutLogo from "@/assets/SAGEA_affiliate-logos4_TUT-1536x828.png";

export const BrandingSection = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-8 py-12">
      <div className="w-full max-w-lg space-y-8 text-center flex flex-col items-center">
        <img 
          src={tutLogo} 
          alt="Tshwane University of Technology Logo" 
          className="w-96 h-96 mx-auto object-contain"
        />
        <h1 className="text-5xl font-bold leading-tight" style={{ color: 'hsl(207, 100%, 25%)' }}>
          Tshwane University<br />of Technology
        </h1>
        <p className="text-3xl italic font-medium" style={{ color: 'hsl(207, 100%, 25%)' }}>
          We empower people
        </p>
      </div>
    </div>
  );
};
