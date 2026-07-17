import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    AdminTable,
    AdminTableColumn,
    DeleteConfirmDialog,
    ActionBar,
    Pagination,
    TableTabButton,
} from "@/components/admin";
import { ProfileFormModal } from "@/components/admin/ProfileFormModal";
import { useRowSelection } from "@/hooks/useRowSelection";
import { usePagination } from "@/hooks/usePagination";
import { useAdminDialogs } from "@/hooks/useAdminDialogs";
import { useSearch } from "@/hooks/useSearch";
import { getImage } from "@/lib/imageStorage";
import { staffApi, ApiError, campusApi, courseApi, moduleApi, residenceApi } from "@/services/adminApi";
import { Loader2 } from "lucide-react";

type CampusLocation = "Arts" | "Arcadia" | "Emalahleni" | "Polokwane" | "Pretoria" | "Soshanguve South" | "Soshanguve North";

const campusLocations: CampusLocation[] = [
    "Arts",
    "Arcadia",
    "Emalahleni",
    "Polokwane",
    "Pretoria",
    "Soshanguve South",
    "Soshanguve North"
];

interface StaffData {
    id: string;
    staffId: string;
    title: string;
    initials: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    department: string;
    departmentId: string;
    level: string;
    campus: string;
    campusId: string;
    residence?: string;
    extracurricular?: string;
    image?: string;
    idNumber?: string;
    location?: string;
    faculty?: string;
    facultyCode?: string;
    course?: string;
    courseCode?: string;
    modules?: string[];
    academicEntries?: any[];
}

const initialData: StaffData[] = [];

const SEARCHABLE_FIELDS: (keyof StaffData)[] = ["staffId", "firstName", "lastName", "role", "department"];

export default function Staff() {
    const { toast } = useToast();
    const [data, setData] = useState<StaffData[]>(initialData);
    const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
    const [levelOptions, setLevelOptions] = useState<{ label: string; value: string }[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([]);
    const [departmentMap, setDepartmentMap] = useState<Record<string, { label: string; facultyId: string }>>({});
    const [courseOptions, setCourseOptions] = useState<{ label: string; value: string }[]>([]);
    const [courseMap, setCourseMap] = useState<Record<string, { label: string; departmentId: string; facultyId: string }>>({});
    const [facultyOptions, setFacultyOptions] = useState<{ label: string; value: string }[]>([]);
    const [moduleOptions, setModuleOptions] = useState<{ label: string; value: string }[]>([]);
    const [moduleMap, setModuleMap] = useState<Record<string, { label: string; departmentId: string; courseId: string }>>({});
    const [campusOptions, setCampusOptions] = useState<{ label: string; value: string }[]>([]);
    const [campusMap, setCampusMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<CampusLocation | "All">("All");
    const [editingItem, setEditingItem] = useState<StaffData | null>(null);
    const [viewingItem, setViewingItem] = useState<StaffData | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formModalMode, setFormModalMode] = useState<"add" | "edit" | "view">("add");
    const [activeModalCampusTab, setActiveModalCampusTab] = useState<string>("");

    const { selectedRows, toggleRow, toggleSelectAll, clearSelection } = useRowSelection();

    const filteredByTab = activeTab === "All"
        ? data
        : data.filter((item) => {
            const campusIdForTab = campusMap[activeTab];
            return item.campusId === campusIdForTab || item.campus === activeTab;
        });
    const { searchQuery, setSearchQuery, filteredData } = useSearch(filteredByTab, SEARCHABLE_FIELDS);
    const { currentPage, setCurrentPage, paginatedData } = usePagination(filteredData, 10);

    const { isDeleteDialogOpen, setIsDeleteDialogOpen } = useAdminDialogs();

    const loadStaff = async (search = "", page = 1) => {
        try {
            setIsLoading(true);
            console.log('[DEBUG loadStaff] Calling staffApi.list...');
            const result = await staffApi.list("", "", search, page, 100);
            console.log('[DEBUG loadStaff] Got result, data count:', result.data.length);
            console.log('[DEBUG loadStaff] First item:', result.data[0]);
            setData(result.data);
            setCurrentPage(page);
            console.log('[DEBUG loadStaff] setData called, data is now:', result.data.length, 'items');
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to load staff";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
        loadLevels();
        loadDepartments();
        loadCourses();
        loadFaculties();
        loadModules();
        loadCampuses();
        loadStaff();
    }, []);

    const loadRoles = async () => {
        try {
            const getAuthToken = () => localStorage.getItem('auth_token') || 'test-token-dev';
            const response = await fetch('/api/admin/roles?limit=1000', { headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error('Failed to load roles');
            const result = await response.json();
            const options = (result.data || []).map((role: any) => ({ label: role.role, value: role.role }));
            setRoleOptions(options);
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    };

    const loadLevels = async () => {
        try {
            const options = Array.from({ length: 9 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) }));
            setLevelOptions(options);
        } catch (error) {
            console.error('Error loading levels:', error);
        }
    };

    const loadDepartments = async () => {
        try {
            const getAuthToken = () => localStorage.getItem('auth_token') || 'test-token-dev';
            const response = await fetch('/api/admin/departments?limit=1000', { headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error('Failed to load departments');
            const result = await response.json();
            console.log('[DEBUG Staff.tsx loadDepartments] Raw response:', JSON.stringify(result.data, null, 2));
            const options = (result.data || []).map((dept: any) => ({ label: dept.name, value: dept.id }));
            const map: Record<string, { label: string; facultyId: string }> = {};
            (result.data || []).forEach((dept: any) => {
                map[dept.id] = { label: dept.name, facultyId: dept.faculty_id };
            });
            console.log('[DEBUG Staff.tsx loadDepartments] Loaded options:', options.length, '| map keys:', Object.keys(map));
            setDepartmentOptions(options);
            setDepartmentMap(map);
        } catch (error) {
            console.error('Error loading departments:', error);
        }
    };

    const loadCourses = async () => {
        try {
            const getAuthToken = () => localStorage.getItem('auth_token') || 'test-token-dev';
            const response = await fetch('/api/admin/courses?limit=1000', { headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error('Failed to load courses');
            const result = await response.json();
            console.log('[DEBUG Staff.tsx loadCourses] Raw response count:', result.data?.length);
            const options = (result.data || []).map((course: any) => ({ label: `${course.code} - ${course.name}`, value: course.id }));
            const map: Record<string, { label: string; departmentId: string; facultyId: string }> = {};
            (result.data || []).forEach((course: any) => {
                map[course.id] = { label: `${course.code} - ${course.name}`, departmentId: course.department_id, facultyId: course.faculty_id };
            });
            console.log('[DEBUG Staff.tsx loadCourses] Loaded options:', options.length);
            setCourseOptions(options);
            setCourseMap(map);
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    };

    const loadFaculties = async () => {
        try {
            const getAuthToken = () => localStorage.getItem('auth_token') || 'test-token-dev';
            const response = await fetch('/api/admin/faculties?limit=1000', { headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error('Failed to load faculties');
            const result = await response.json();
            console.log('[DEBUG Staff.tsx loadFaculties] Raw response:', JSON.stringify(result.data, null, 2));
            const options = (result.data || []).map((faculty: any) => ({ label: faculty.name, value: faculty.id }));
            console.log('[DEBUG Staff.tsx loadFaculties] Loaded options:', options.length);
            setFacultyOptions(options);
        } catch (error) {
            console.error('Error loading faculties:', error);
        }
    };

    const loadModules = async () => {
        try {
            const getAuthToken = () => localStorage.getItem('auth_token') || 'test-token-dev';
            const response = await fetch('/api/admin/modules?limit=1000', { headers: { 'Authorization': `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' } });
            if (!response.ok) throw new Error('Failed to load modules');
            const result = await response.json();
            console.log('[DEBUG Staff.tsx loadModules] Raw response count:', result.data?.length);
            const options = (result.data || []).map((mod: any) => ({ label: `${mod.code} - ${mod.name}`, value: mod.id }));
            const map: Record<string, { label: string; departmentId: string; courseId: string }> = {};
            (result.data || []).forEach((mod: any) => {
                map[mod.id] = { label: `${mod.code} - ${mod.name}`, departmentId: mod.department_id, courseId: mod.course_id };
            });
            console.log('[DEBUG Staff.tsx loadModules] Loaded options:', options.length);
            setModuleOptions(options);
            setModuleMap(map);
        } catch (error) {
            console.error('Error loading modules:', error);
        }
    };

    const loadCampuses = async () => {
        try {
            const result = await campusApi.list('', 1, 1000);
            const map: Record<string, string> = {};
            const options: { label: string; value: string }[] = [];
            result.data.forEach((campus: any) => {
                const shortName = campus.name.replace(' Campus', '');
                map[shortName] = campus.id;
                options.push({ label: shortName, value: shortName });
            });
            setCampusMap(map);
            setCampusOptions(options);
        } catch (error) {
            console.error('Error loading campuses:', error);
        }
    };

    const getCampusLabel = (shortName: string) => {
        if (shortName === "All") {
            return campusOptions.length > 0 ? campusOptions[0].label : "";
        }
        return shortName;
    };



    const handleAddOpen = () => {
        setEditingItem(null);
        setViewingItem(null);
        setFormModalMode("add");
        setActiveModalCampusTab(getCampusLabel(activeTab));
        setIsFormModalOpen(true);
    };

    const handleView = (item: StaffData) => {
        console.log('[DEBUG Staff.tsx handleView] Staff item clicked:', JSON.stringify(item, null, 2));
        console.log('[DEBUG Staff.tsx handleView] Complex fields - faculty:', item.faculty, '| course:', item.course, '| modules:', JSON.stringify(item.modules), '| extracurricular:', item.extracurricular, '| residence:', item.residence, '| departmentId:', item.departmentId);
        setViewingItem(item);
        setEditingItem(null);
        setFormModalMode("view");
        setActiveModalCampusTab(getCampusLabel(item.campus));
        setIsFormModalOpen(true);
    };

    const handleEdit = () => {
        const selectedIndex = Array.from(selectedRows)[0];
        const item = paginatedData[selectedIndex];
        if (item) {
            setEditingItem(item);
            setViewingItem(null);
            setFormModalMode("edit");
            setActiveModalCampusTab(getCampusLabel(item.campus));
            setIsFormModalOpen(true);
        }
    };

     const handleSave = async (formData: Record<string, any>) => {
         try {
             setIsLoading(true);
             console.log('[DEBUG handleSave] formData.campus:', formData.campus);
             console.log('[DEBUG handleSave] campusMap:', campusMap);
             const campusId = campusMap[formData.campus] || formData.campus;
             console.log('[DEBUG handleSave] campusId resolved:', campusId);

             let staffId: string | undefined;

             if (formModalMode === "add") {
                 console.log('[DEBUG handleSave] Creating staff...');
                 const created = await staffApi.create({
                     staffId: formData.staffNumber,
                     title: formData.title,
                     initials: formData.initials,
                     firstName: formData.firstName,
                     lastName: formData.lastName,
                     email: formData.email,
                     phone: formData.phone || undefined,
                     role: formData.role || "Staff",
                     departmentId: formData.departmentId,
                     level: formData.level || "1",
                     campus: formData.campus,
                     campusId: campusId,
                     idNumber: formData.idNumber || undefined,
                     location: formData.location || undefined,
                     faculty: formData.faculty || undefined,
                     facultyCode: formData.facultyCode || undefined,
                     course: formData.course || undefined,
                     courseCode: formData.courseCode || undefined,
                     modules: formData.modules || [],
                     academicEntries: formData.academicEntries || [],
                     residence: formData.residence || undefined,
                     extracurricular: formData.extracurricular || undefined,
                     image: formData.image || undefined,
                 });
                 staffId = created.staffId;
                 console.log('[DEBUG handleSave] Staff created, now reloading...');
                 toast({ title: "Staff Added", description: `${formData.firstName} ${formData.lastName} has been successfully added.` });
             } else if (formModalMode === "edit" && editingItem) {
                 const updated = await staffApi.update(editingItem.id, {
                     staffId: formData.staffNumber,
                     title: formData.title,
                     initials: formData.initials,
                     firstName: formData.firstName,
                     lastName: formData.lastName,
                     email: formData.email,
                     phone: formData.phone || undefined,
                     role: formData.role || "Staff",
                     departmentId: formData.departmentId,
                     level: formData.level || "1",
                     campus: formData.campus,
                     campusId: campusId,
                     idNumber: formData.idNumber || undefined,
                     location: formData.location || undefined,
                     faculty: formData.faculty || undefined,
                     facultyCode: formData.facultyCode || undefined,
                     course: formData.course || undefined,
                     courseCode: formData.courseCode || undefined,
                     modules: formData.modules || [],
                     academicEntries: formData.academicEntries || [],
                     residence: formData.residence || undefined,
                     extracurricular: formData.extracurricular || undefined,
                     image: formData.image || undefined,
                 });
                 staffId = updated.staffId;
                 toast({ title: "Staff Updated", description: `${formData.firstName} ${formData.lastName} has been successfully updated.` });
             }

             clearSelection();
             console.log('[DEBUG handleSave] About to call loadStaff...');
             await loadStaff();
             console.log('[DEBUG handleSave] loadStaff completed');

             // Auto-update residence manager if staff member is assigned to a residence
             if (formData.residence) {
                 try {
                     const residenceResult = await residenceApi.list('', '', formData.residence, 1, 10);
                     const matchingResidence = residenceResult.data.find((r: any) => r.residence === formData.residence);
                     if (matchingResidence) {
                         await residenceApi.update(matchingResidence.id, {
                             manager: staffId || formData.staffNumber,
                         });
                         console.log('[DEBUG handleSave] Residence manager auto-updated:', matchingResidence.id, '->', staffId);
                     }
                 } catch (resError) {
                     console.error('[DEBUG handleSave] Failed to auto-update residence manager:', resError);
                 }
             }

             // Reset filters to ensure new record is visible
             setSearchQuery("");
         } catch (error) {
             const message = error instanceof ApiError ? error.message : "Failed to save staff";
             toast({ title: "Error", description: message, variant: "destructive" });
             throw error;
         } finally {
             setIsLoading(false);
         }
     };

    const confirmDelete = async () => {
        try {
            setIsLoading(true);
            const selectedIndices = Array.from(selectedRows);
            const itemsToDelete = selectedIndices.map((idx) => paginatedData[idx]);
            const idsToDelete = itemsToDelete.map((item) => item.id);
            const countDeleted = selectedRows.size;

            if (idsToDelete.length > 1) {
                await staffApi.batchDelete(idsToDelete);
            } else {
                await staffApi.delete(idsToDelete[0]);
            }

            setIsDeleteDialogOpen(false);
            clearSelection();
            toast({ title: "Staff Deleted", description: `${countDeleted} staff member(s) have been successfully deleted.` });
            await loadStaff();
        } catch (error) {
            const message = error instanceof ApiError ? error.message : "Failed to delete staff";
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const columns: AdminTableColumn<StaffData>[] = [
        {
            key: "image",
            label: "Photo",
            width: "w-14",
            render: (_, row) => (
                row.image ? (
                    <img src={row.image} alt={`${row.firstName} ${row.lastName}`} className="w-9 h-9 rounded-full object-cover cursor-pointer" onClick={() => handleView(row)} />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground cursor-pointer" onClick={() => handleView(row)}>
                        {row.initials || (row.firstName[0] + row.lastName[0])}
                    </div>
                )
            ),
        },
        { key: "staffId", label: "Staff No.", width: "w-28", nowrap: true },
        {
            key: "fullName",
            label: "Full Name",
            width: "w-[220px]",
            render: (_, row) => (
                <button className="text-primary hover:underline text-left font-medium truncate block max-w-full" onClick={() => handleView(row)}>
                    {row.title} {row.firstName} {row.lastName}
                </button>
            ),
        },
        { key: "department", label: "Department", width: "w-[180px]", truncate: true },
        { key: "extracurricular", label: "Extracurricular", width: "w-[170px]", truncate: true },
        { key: "residence", label: "Residence", width: "w-[150px]", truncate: true },
        { key: "level", label: "Level", width: "w-16", nowrap: true },
        { key: "role", label: "Role", nowrap: true },
    ];

    const tabs = ["All", ...campusLocations];

    return (
        <div className="w-full h-full flex flex-col items-center px-6 bg-background">
            <div className="w-full max-w-[1600px] h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
                        <Input
                            type="search"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="pl-16 pr-6 bg-card border-none h-12 text-lg rounded-full shadow-sm placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-muted-foreground/30"
                        />
                    </div>

                    <Button onClick={handleAddOpen} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-3 rounded-full pl-6 pr-2 h-12 shadow-lg shadow-primary/30">
                        <span className="font-medium">Add</span>
                        <div className="bg-white rounded-full p-2">
                            <Plus className="h-5 w-5 text-primary" />
                        </div>
                    </Button>
                </div>

                {/* Profile Form Modal */}
                <ProfileFormModal
                    open={isFormModalOpen}
                    onOpenChange={setIsFormModalOpen}
                    title={formModalMode === "add" ? "ADD STAFF" : formModalMode === "edit" ? "EDIT STAFF" : "VIEW STAFF"}
                    mode={formModalMode}
                    initialData={viewingItem || editingItem || {}}
                    onSave={handleSave}
                    isLoading={isLoading}
                    campusOptions={campusOptions}
                    activeCampusTab={activeModalCampusTab}
                    onCampusTabChange={setActiveModalCampusTab}
                    departmentOptions={departmentOptions}
                    departmentMap={departmentMap}
                    courseOptions={courseOptions}
                    courseMap={courseMap}
                    facultyOptions={facultyOptions}
                    moduleOptions={moduleOptions}
                    moduleMap={moduleMap}
                    roleOptions={roleOptions}
                    levelOptions={levelOptions}
                    isStaff={true}
                    isExpanded={true}
                />

                <DeleteConfirmDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    itemCount={selectedRows.size}
                    itemType="Staff"
                    onConfirm={confirmDelete}
                />

                {/* Table Container with Tabs */}
                <div className="bg-card rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="flex items-end gap-2 mb-0 overflow-x-auto overflow-y-hidden tabs-scrollbar flex-shrink-0 px-6 pb-2" role="tablist" aria-label="Campus filter">
                        {tabs.map((campus) => (
                            <TableTabButton key={campus} label={campus} isActive={activeTab === campus} onClick={() => { setActiveTab(campus as CampusLocation | "All"); clearSelection(); setCurrentPage(1); }} />
                        ))}
                    </div>

                    <div className="bg-card rounded-lg shadow-sm p-6 flex flex-col flex-1 overflow-hidden relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-background/30 flex items-center justify-center z-10 rounded-lg">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <AdminTable
                            columns={columns}
                            data={paginatedData}
                            selectedRows={selectedRows}
                            onRowToggle={toggleRow}
                            onSelectAll={() => toggleSelectAll(paginatedData.length)}
                        />
                    </div>

                    {selectedRows.size > 0 && (
                        <ActionBar
                            selectedCount={selectedRows.size}
                            onClear={clearSelection}
                            onEdit={selectedRows.size === 1 ? handleEdit : undefined}
                            onDelete={() => setIsDeleteDialogOpen(true)}
                        />
                    )}
                </div>

                <div className="flex-shrink-0 bg-background">
                    <Pagination currentPage={currentPage} onPageChange={setCurrentPage} totalItems={filteredData.length} itemsPerPage={10} />
                </div>
            </div>
        </div>
    );
}
