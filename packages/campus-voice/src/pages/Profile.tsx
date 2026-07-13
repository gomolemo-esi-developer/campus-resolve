import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileDrawer } from "@/components/MobileDrawer";
import { useProfile } from "@/hooks/useProfile";

const Profile = () => {
  const { profile, fetchProfile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <div className="py-6">
        {/* Navigation Bar */}
        <MobileHeader
          title="Profile"
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Mobile Drawer */}
        <MobileDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

        {/* Content */}
        <div className="space-y-10">

        {/* Personal Information Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">Personal Information</h2>
          </div>

          <Card className="p-8 space-y-8 bg-card border-border/50 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-medium text-foreground">Title</Label>
                <Input
                  id="title"
                  readOnly
                  disabled
                  value={profile?.title || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="initials" className="text-sm font-medium text-foreground">Initials</Label>
                <Input
                  id="initials"
                  readOnly
                  disabled
                  value={profile?.initials || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="id-number" className="text-sm font-medium text-foreground">ID/Passport Number</Label>
                <Input
                  id="id-number"
                  readOnly
                  disabled
                  value={profile?.idNumber || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="full-name" className="text-sm font-medium text-foreground">First Name</Label>
                <Input
                  id="full-name"
                  readOnly
                  disabled
                  value={profile?.firstName || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="last-name" className="text-sm font-medium text-foreground">Last Name</Label>
                <Input
                  id="last-name"
                  readOnly
                  disabled
                  value={profile?.lastName || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  readOnly
                  disabled
                  value={profile?.email || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Academic Information Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-foreground">Academic Information</h2>
          </div>

          <Card className="p-8 space-y-6 bg-card border-border/50 shadow-sm">
            <div className="space-y-3">
              <Label htmlFor="student-number" className="text-sm font-medium text-foreground">Student Number</Label>
              <Input
                id="student-number"
                readOnly
                disabled
                value={profile?.studentNumber || ""}
                className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium text-foreground">Faculty</Label>
              <div className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm">
                {profile?.faculty || "Not Set"}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="department" className="text-sm font-medium text-foreground">Department Name</Label>
                <Input
                  id="department"
                  readOnly
                  disabled
                  value={profile?.department || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="campus" className="text-sm font-medium text-foreground">Campus</Label>
                <Input
                  id="campus"
                  readOnly
                  disabled
                  value={profile?.campus || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="course" className="text-sm font-medium text-foreground">Course</Label>
                <Input
                  id="course"
                  readOnly
                  disabled
                  value={profile?.course || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="extracurricular" className="text-sm font-medium text-foreground">Extracurricular</Label>
                <Input
                  id="extracurricular"
                  readOnly
                  disabled
                  value={profile?.extracurricular || ""}
                  className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <Label htmlFor="residence" className="text-sm font-medium text-foreground">School Provided Residence</Label>
                 <Input
                   id="residence"
                   readOnly
                   disabled
                   value={profile?.residence || ""}
                   className="bg-background border-border/60 h-11 rounded-xl shadow-sm"
                 />
               </div>
             </div>
           </Card>
        </div>

        {/* Modules Section */}
        <div className="space-y-6">
          <Card className="p-8 space-y-6 bg-card border-border/50 shadow-sm">
            <div className="space-y-3">
             <Label className="text-sm font-medium text-foreground">Modules</Label>
              {profile?.modules && profile.modules.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted rounded-xl">
                  {profile.modules.map(moduleLabel => (
                    <div
                      key={moduleLabel}
                      className="flex items-center gap-2 bg-foreground text-background px-3 py-1.5 rounded-lg text-sm"
                    >
                      <span>{moduleLabel}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/60">No modules assigned.</p>
              )}
            </div>
          </Card>
        </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
