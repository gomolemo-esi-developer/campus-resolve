import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaffProfile } from "@/hooks/useProfile";

interface ProfileFormProps {
  initialData?: StaffProfile;
}

export const ProfileForm = ({ initialData }: ProfileFormProps) => {
  const profile: Partial<StaffProfile> = initialData || {};
  const modules = profile.modules || [];
  const professionalEntries = profile.professionalEntries || [];

  const getInputClasses = (value?: string) => cn(
    "bg-background rounded-lg transition-all duration-200",
    value ? "border border-[#E8E8E8] bg-[#F8F8F8]" : "border border-[#E8E8E8]"
  );

  const getLabelClasses = (value?: string) => cn(
    "text-sm transition-all duration-200",
    value ? "text-secondary font-semibold" : "text-[#2C2C2C]"
  );

  return (
    <div className="max-w-4xl space-y-8">
      {/* Personal Information */}
      <div className="space-y-6">
        <h2 className="text-secondary font-semibold text-lg">Personal Information</h2>

        {/* Row 1: Title, Initials, ID Number */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.title)}>Title</Label>
            <Input readOnly disabled value={profile.title || ""} className={getInputClasses(profile.title)} />
          </div>
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.initials)}>Initials</Label>
            <Input readOnly disabled value={profile.initials || ""} className={getInputClasses(profile.initials)} />
          </div>
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.idNumber)}>ID / Passport Number</Label>
            <Input readOnly disabled value={profile.idNumber || ""} className={getInputClasses(profile.idNumber)} />
          </div>
        </div>

        {/* Row 2: First Name, Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.firstName)}>First Name</Label>
            <Input readOnly disabled value={profile.firstName || ""} className={getInputClasses(profile.firstName)} />
          </div>
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.lastName)}>Last Name</Label>
            <Input readOnly disabled value={profile.lastName || ""} className={getInputClasses(profile.lastName)} />
          </div>
        </div>

        {/* Row 3: Email, Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.email)}>Email Address</Label>
            <Input readOnly disabled type="email" value={profile.email || ""} className={getInputClasses(profile.email)} />
          </div>
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.location)}>Location</Label>
            <div className="relative">
              <Input readOnly disabled value={profile.location || ""} className={cn(getInputClasses(profile.location), "pr-10")} />
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
            </div>
          </div>
        </div>

        {/* Row 4: Staff Number, Campus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.staffNumber)}>Staff Number</Label>
            <Input readOnly disabled value={profile.staffNumber || ""} className={getInputClasses(profile.staffNumber)} />
          </div>
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.campus)}>Campus</Label>
            <Input readOnly disabled value={profile.campus || ""} className={getInputClasses(profile.campus)} />
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="space-y-6">
        <h2 className="text-secondary font-semibold text-lg">Academic Information</h2>

        {/* Row 1: Faculty, Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.faculty)}>Faculty</Label>
            <Input readOnly disabled value={profile.faculty || ""} className={getInputClasses(profile.faculty)} />
          </div>
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.department)}>Department Name</Label>
            <Input readOnly disabled value={profile.department || ""} className={getInputClasses(profile.department)} />
          </div>
        </div>

        {/* Row 2: Course */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.course)}>Course</Label>
            <Input readOnly disabled value={profile.course || ""} className={getInputClasses(profile.course)} />
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="space-y-6">
        <h2 className="text-secondary font-semibold text-lg">Modules</h2>

        <div className="space-y-2">
          <Label>Selected Modules ({modules.length})</Label>
          {modules.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {modules.map((moduleName) => (
                <div
                  key={moduleName}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full text-sm"
                >
                  <span className="font-medium">{moduleName}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No modules assigned.</div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-6">
        <h2 className="text-secondary font-semibold text-lg">Additional Information</h2>

        {/* Row 1: Extracurricular, Residence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.extracurricular)}>Extracurricular Activities</Label>
            <Input readOnly disabled value={profile.extracurricular || ""} className={getInputClasses(profile.extracurricular)} />
          </div>
          <div className="space-y-2">
            <Label className={getLabelClasses(profile.residence)}>School Provided Residence</Label>
            <Input readOnly disabled value={profile.residence || ""} className={getInputClasses(profile.residence)} />
          </div>
        </div>
      </div>

      {/* Professional Information */}
      {professionalEntries.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-secondary font-semibold text-lg">Professional Information</h2>

          {professionalEntries.map((entry) => (
            <div key={entry.id} className="space-y-4 pb-6">
              {/* Course Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={getLabelClasses(entry.course)}>Course Name</Label>
                  <Input readOnly disabled value={entry.course || ""} className={getInputClasses(entry.course)} />
                </div>
                <div className="space-y-2">
                  <Label className={getLabelClasses(entry.courseCode)}>Course Code</Label>
                  <Input readOnly disabled value={entry.courseCode || ""} className={getInputClasses(entry.courseCode)} />
                </div>
              </div>

              {/* Department Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={getLabelClasses(entry.department)}>Department Name</Label>
                  <Input readOnly disabled value={entry.department || ""} className={getInputClasses(entry.department)} />
                </div>
                <div className="space-y-2">
                  <Label className={getLabelClasses(entry.departmentCode)}>Department Code</Label>
                  <Input readOnly disabled value={entry.departmentCode || ""} className={getInputClasses(entry.departmentCode)} />
                </div>
              </div>

              {/* Faculty Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={getLabelClasses(entry.faculty)}>Faculty Name</Label>
                  <Input readOnly disabled value={entry.faculty || ""} className={getInputClasses(entry.faculty)} />
                </div>
                <div className="space-y-2">
                  <Label className={getLabelClasses(entry.facultyCode)}>Faculty Code</Label>
                  <Input readOnly disabled value={entry.facultyCode || ""} className={getInputClasses(entry.facultyCode)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
