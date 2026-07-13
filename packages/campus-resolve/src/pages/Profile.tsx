import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { InboxPanel } from "@/components/InboxPanel";
import { ProfileForm } from "@/components/ProfileForm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfile, StaffProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const Profile = () => {
  const { fetchProfile } = useProfile();

  const [initialData, setInitialData] = useState<StaffProfile | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the staff member's profile data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const profileData = await fetchProfile();
        setInitialData(profileData ?? undefined);
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 bg-[#F8F8F8] lg:ml-72 xl:mr-[420px] h-screen pt-16 lg:pt-0">
          <ScrollArea className="h-full">
            <div className="flex justify-center items-center p-4 md:p-8 h-64">
              <div className="text-muted-foreground">Loading profile...</div>
            </div>
          </ScrollArea>
        </main>
        <InboxPanel />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      
      <main className="flex-1 bg-[#F8F8F8] lg:ml-72 xl:mr-[420px] h-screen pt-16 lg:pt-0">
        <ScrollArea className="h-full">
          <div className="flex justify-center p-4 md:p-8">
            <div className="w-full max-w-3xl">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">Profile</h1>
              <ProfileForm initialData={initialData} />
            </div>
          </div>
        </ScrollArea>
      </main>

      <InboxPanel />
    </div>
  );
};

export default Profile;
