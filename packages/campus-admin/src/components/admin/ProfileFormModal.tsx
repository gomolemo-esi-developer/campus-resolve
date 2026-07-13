import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { X, Loader2, Check } from "lucide-react";
import { ImageUploadField } from "./ImageUploadField";
import { ModalTabButton } from "./ModalTabButton";
import { FormSelect } from "./FormSelect";
import { cn } from "@/lib/utils";

interface Option {
    label: string;
    value: string;
}

interface ProfileFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    mode: "add" | "edit" | "view";
    initialData?: Record<string, any>;
    onSave?: (data: Record<string, any>) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
    titleOptions?: Option[];
    campusOptions?: Option[];
    activeCampusTab?: string;
    onCampusTabChange?: (campus: string) => void;
    facultyOptions?: Option[];
    departmentOptions?: Option[];
    departmentMap?: Record<string, { label: string; facultyId: string }>;
    courseOptions?: Option[];
    courseMap?: Record<string, { label: string; departmentId: string; facultyId: string }>;
    extracurricularOptions?: Option[];
    residenceOptions?: Option[];
    moduleOptions?: Option[];
    moduleMap?: Record<string, { label: string; departmentId: string; courseId: string }>;
    roleOptions?: Option[];
    levelOptions?: Option[];
    isStaff?: boolean;
    isExpanded?: boolean;
}

const titleOptionsDefault = [
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Ms.", value: "Ms." },
    { label: "Dr.", value: "Dr." },
    { label: "Prof.", value: "Prof." },
];

const extracurricularOptionsDefault = [
    { label: "Sports Committee", value: "Sports Committee" },
    { label: "Sports", value: "Sports" },
    { label: "Music", value: "Music" },
    { label: "Drama", value: "Drama" },
    { label: "Debate", value: "Debate" },
    { label: "Chess", value: "Chess" },
    { label: "Community Service", value: "Community Service" },
    { label: "Student Government", value: "Student Government" },
    { label: "Research Club", value: "Research Club" },
    { label: "Tech Club", value: "Tech Club" },
    { label: "Science Fair Committee", value: "Science Fair Committee" },
    { label: "Academic Board", value: "Academic Board" },
    { label: "Engineering Faculty Board", value: "Engineering Faculty Board" },
    { label: "Coding Club", value: "Coding Club" },
    { label: "HR Committee", value: "HR Committee" },
    { label: "AI Research Group", value: "AI Research Group" },
];

const residenceOptionsDefault = [
    { label: "TUT Residence A", value: "TUT Residence A" },
    { label: "TUT Residence B", value: "TUT Residence B" },
    { label: "TUT Residence C", value: "TUT Residence C" },
    { label: "TUT Residence D", value: "TUT Residence D" },
    { label: "TUT Residence E", value: "TUT Residence E" },
    { label: "TUT Residence F", value: "TUT Residence F" },
    { label: "On-Campus Residence", value: "On-Campus Residence" },
    { label: "Off-Campus", value: "Off-Campus" },
    { label: "Commuter", value: "Commuter" },
];

export function ProfileFormModal({
    open,
    onOpenChange,
    title,
    mode,
    initialData,
    onSave,
    onCancel,
    isLoading = false,
    titleOptions = titleOptionsDefault,
    campusOptions = [],
    activeCampusTab,
    onCampusTabChange,
    facultyOptions = [],
    departmentOptions = [],
    departmentMap = {},
    courseOptions = [],
    courseMap = {},
    extracurricularOptions = extracurricularOptionsDefault,
    residenceOptions = residenceOptionsDefault,
    moduleOptions = [],
    moduleMap = {},
    roleOptions = [],
    levelOptions = [],
    isStaff = false,
    isExpanded = false,
}: ProfileFormModalProps) {
    const isReadOnly = mode === "view";
    const isStudent = !isStaff && (initialData?.studentId || initialData?.studentId === "");

    const [internalActiveCampusTab, setInternalActiveCampusTab] = useState<string>(
        activeCampusTab || (initialData?.campus || (campusOptions.length > 0 ? campusOptions[0].value : ""))
    );

    const activeCampus = activeCampusTab !== undefined ? activeCampusTab : internalActiveCampusTab;
    const setActiveCampus = onCampusTabChange ? onCampusTabChange : setInternalActiveCampusTab;

    const campusTabs = campusOptions.map(c => c.label);
    const tabListRef = useRef<HTMLDivElement>(null);

    const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
        let newIndex = currentIndex;

        switch (e.key) {
            case "ArrowRight":
                e.preventDefault();
                newIndex = (currentIndex + 1) % campusTabs.length;
                break;
            case "ArrowLeft":
                e.preventDefault();
                newIndex = (currentIndex - 1 + campusTabs.length) % campusTabs.length;
                break;
            case "Home":
                e.preventDefault();
                newIndex = 0;
                break;
            case "End":
                e.preventDefault();
                newIndex = campusTabs.length - 1;
                break;
            default:
                return;
        }

        const tabButtons = tabListRef.current?.querySelectorAll("[role='tab']");
        (tabButtons?.[newIndex] as HTMLButtonElement)?.focus();
        setActiveCampus(campusTabs[newIndex]);
    }, [campusTabs, setActiveCampus]);

    const currentCampusIndex = campusOptions.findIndex(c => c.label === activeCampus);

    const [personalInfo, setPersonalInfo] = useState(() => ({
        title: mode === "add" ? "" : (initialData?.title || ""),
        initials: mode === "add" ? "" : (initialData?.initials || ""),
        idNumber: mode === "add" ? "" : (initialData?.idNumber || ""),
        firstName: mode === "add" ? "" : (initialData?.firstName || ""),
        lastName: mode === "add" ? "" : (initialData?.lastName || ""),
        email: mode === "add" ? "" : (initialData?.email || ""),
        location: mode === "add" ? "" : (initialData?.location || ""),
        staffNumber: mode === "add" ? "" : (initialData?.staffNumber || initialData?.staffId || initialData?.studentId || ""),
        campus: mode === "add" ? "" : (initialData?.campus || ""),
    }));

    // Profile image state
    const [profileImage, setProfileImage] = useState(() => initialData?.image || "");

    const [roleInfo, setRoleInfo] = useState(() => ({
        role: mode === "add" ? "" : (initialData?.role || ""),
        level: mode === "add" ? "" : (initialData?.level || ""),
    }));

    const [additionalInfo, setAdditionalInfo] = useState(() => ({
        extracurricular: mode === "add" ? "" : (initialData?.extracurricular || ""),
        residence: mode === "add" ? "" : (initialData?.residence || ""),
    }));

    const [selectedModules, setSelectedModules] = useState<string[]>(() => 
        mode === "add" ? [] : (initialData?.modules || [])
    );
    const [moduleSearch, setModuleSearch] = useState("");
    const [showModuleDropdown, setShowModuleDropdown] = useState(false);
    const moduleInputRef = useRef<HTMLInputElement>(null);

    const [academicEntries, setAcademicEntries] = useState<{
        id: string;
        course: string;
        courseCode: string;
        department: string;
        departmentId: string;
        faculty: string;
        facultyCode: string;
    }[]>(
        initialData?.academicEntries && initialData.academicEntries.length > 0
            ? initialData.academicEntries
            : [{ id: "new-1", course: "", courseCode: "", department: "", departmentId: "", faculty: "", facultyCode: "" }]
    );

    // Sync state with initialData when it changes (e.g., when opening modal for a different record)
    useEffect(() => {
        // Guard against empty or invalid initialData
        if (!initialData || !initialData.id || Object.keys(initialData).length === 0) {
            return;
        }
        
        console.log('[DEBUG ProfileFormModal] initialData received:', JSON.stringify(initialData, null, 2));
        console.log('[DEBUG ProfileFormModal] Simple fields - title:', initialData?.title, '| initials:', initialData?.initials, '| firstName:', initialData?.firstName, '| lastName:', initialData?.lastName);
        console.log('[DEBUG ProfileFormModal] Complex fields - faculty:', initialData?.faculty, '| department:', initialData?.department, '| departmentId:', initialData?.departmentId, '| course:', initialData?.course);
        console.log('[DEBUG ProfileFormModal] Array fields - modules:', JSON.stringify(initialData?.modules), '| extracurricular:', initialData?.extracurricular, '| residence:', initialData?.residence);
        
        if (initialData && initialData.id && Object.keys(initialData).length > 0) {
            setPersonalInfo({
                title: initialData.title || "",
                initials: initialData.initials || "",
                idNumber: initialData.idNumber || initialData.idNumber === null ? "" : (initialData.idNumber || ""),
                firstName: initialData.firstName || "",
                lastName: initialData.lastName || "",
                email: initialData.email || "",
                location: initialData.location || "",
                staffNumber: initialData.staffNumber || initialData.staffId || initialData.studentId || "",
                campus: initialData.campus || "",
            });
            
            // Set profile image
            setProfileImage(initialData.image || "");
            
            // Set role - handle both string and number formats from database
            let roleValue = "";
            if (initialData.role) {
                roleValue = typeof initialData.role === 'number' ? String(initialData.role) : initialData.role;
                console.log('[DEBUG ProfileFormModal] roleValue before check:', roleValue, '| roleOptions length:', roleOptions.length);
                
                // Check if role exists in options
                const roleExists = roleOptions.find(r => r.value === roleValue);
                if (roleExists) {
                    console.log('[DEBUG ProfileFormModal] Role found in options');
                } else {
                    console.log('[DEBUG ProfileFormModal] Role NOT found in options, using raw value');
                    // Keep the raw value - FormSelect will show it
                }
            }
            
            // Set level - handle both string and number formats from database
            let levelValue = "";
            if (initialData.level !== undefined && initialData.level !== null) {
                levelValue = typeof initialData.level === 'number' ? String(initialData.level) : initialData.level;
                console.log('[DEBUG ProfileFormModal] levelValue before check:', levelValue, '| levelOptions length:', levelOptions.length);
                
                // Check if level exists in options
                const levelExists = levelOptions.find(l => l.value === levelValue);
                if (levelExists) {
                    console.log('[DEBUG ProfileFormModal] Level found in options');
                } else {
                    console.log('[DEBUG ProfileFormModal] Level NOT found in options, trying label match');
                    const levelByLabel = levelOptions.find(l => l.label === levelValue);
                    if (levelByLabel) {
                        levelValue = levelByLabel.value;
                    }
                }
            }
            
            console.log('[DEBUG ProfileFormModal] Setting roleInfo - final roleValue:', roleValue, '| final levelValue:', levelValue);
            setRoleInfo({
                role: roleValue,
                level: levelValue,
            });
            
            // Set extracurricular - handle both string and array formats
            let extracurricularValue = "";
            if (initialData.extracurricular) {
                extracurricularValue = Array.isArray(initialData.extracurricular) 
                    ? initialData.extracurricular[0] || "" 
                    : initialData.extracurricular;
            }
            
            // Set residence - handle both string and array formats  
            let residenceValue = "";
            if (initialData.residence) {
                residenceValue = Array.isArray(initialData.residence) 
                    ? initialData.residence[0] || "" 
                    : initialData.residence;
            }
            
            console.log('[DEBUG ProfileFormModal] Setting additionalInfo - extracurricular:', extracurricularValue, '| residence:', residenceValue);
            setAdditionalInfo({
                extracurricular: extracurricularValue,
                residence: residenceValue,
            });
            
            console.log('[DEBUG ProfileFormModal] Setting selectedModules:', JSON.stringify(initialData.modules || []));
            // Ensure all module values are strings
            const normalizedModules = (initialData.modules || []).map((m: any) => String(m));
            console.log('[DEBUG ProfileFormModal] Normalized modules:', JSON.stringify(normalizedModules));
            setSelectedModules(normalizedModules);
            
            // Build academicEntries from initialData (handles both student and staff data formats)
            let newAcademicEntries;
            if (initialData.academicEntries && initialData.academicEntries.length > 0) {
                // Transform database format to form format - convert names/codes to IDs
                newAcademicEntries = initialData.academicEntries.map((entry: any) => {
                    let facultyId = entry.faculty || "";
                    let departmentId = entry.departmentId || "";
                    let courseId = entry.course || "";
                    
                    // If we have facultyName, try to find the ID
                    if (!facultyId && entry.facultyName) {
                        const facOpt = facultyOptions.find(f => f.label === entry.facultyName);
                        if (facOpt) {
                            facultyId = facOpt.value;
                        } else {
                            // Try by code
                            const facByCode = facultyOptions.find(f => f.value.startsWith(entry.facultyCode) || entry.facultyName.includes(f.label.replace(/^Faculty of /, '')));
                            if (facByCode) {
                                facultyId = facByCode.value;
                            }
                        }
                    }
                    
                    // If we have departmentName, try to find the ID
                    if (!departmentId && entry.departmentName) {
                        const deptOpt = departmentOptions.find(d => d.label === entry.departmentName);
                        if (deptOpt) {
                            departmentId = deptOpt.value;
                        } else {
                            // Try by code
                            const deptByCode = departmentOptions.find(d => d.value.startsWith(entry.departmentCode) || (entry.departmentName && d.label.toLowerCase().includes(entry.departmentName.toLowerCase())));
                            if (deptByCode) {
                                departmentId = deptByCode.value;
                            }
                        }
                    }
                    
                    // If we have courseName, try to find the ID
                    if (!courseId && entry.courseName) {
                        const courseOpt = courseOptions.find(c => c.label.includes(entry.courseName));
                        if (courseOpt) {
                            courseId = courseOpt.value;
                        }
                    }
                    
                    // If still no courseId and initialData has a course name, try to resolve it
                    let courseDisplayName = "";
                    if (!courseId && initialData.course) {
                        courseDisplayName = initialData.course;
                        // Try exact match first (full label)
                        const courseByLabel = courseOptions.find(c => c.label === initialData.course);
                        if (courseByLabel) {
                            courseId = courseByLabel.value;
                        } else {
                            // Try matching by course code from courseCode field
                            if (initialData.courseCode) {
                                const courseByCode = courseOptions.find(c => 
                                    c.label.startsWith(initialData.courseCode + ' -') ||
                                    c.value === initialData.courseCode
                                );
                                if (courseByCode) {
                                    courseId = courseByCode.value;
                                }
                            }
                            
                            // Try matching by name containing
                            if (!courseId) {
                                const courseByContains = courseOptions.find(c => 
                                    c.label.toLowerCase().includes(initialData.course.toLowerCase())
                                );
                                if (courseByContains) {
                                    courseId = courseByContains.value;
                                }
                            }
                        }
                    }
                    
                    console.log('[DEBUG ProfileFormModal] Resolved course - initialData.course:', initialData.course, '| courseId:', courseId, '| courseDisplayName:', courseDisplayName);
                    
                    return {
                        id: entry.id || "new-1",
                        faculty: facultyId,
                        departmentId: departmentId,
                        course: courseId || courseDisplayName, // Use name as fallback if no ID found
                        courseDisplayName: courseDisplayName, // Store original name for display
                        facultyCode: entry.facultyCode || "",
                        departmentCode: entry.departmentCode || "",
                        courseCode: entry.courseCode || "",
                    };
                });
                console.log('[DEBUG ProfileFormModal] Using academicEntries from initialData (transformed):', JSON.stringify(newAcademicEntries));
            } else if (initialData.faculty || initialData.department || initialData.course || initialData.departmentId) {
                // Determine faculty ID - may need to look up by name if only name is provided
                let facultyIdValue = initialData.facultyId || "";
                if (!facultyIdValue && initialData.faculty) {
                    // Try to find matching faculty by name
                    const facOpt = facultyOptions.find(f => f.label === initialData.faculty);
                    if (facOpt) {
                        facultyIdValue = facOpt.value;
                    } else {
                        // Try matching by partial name (e.g., "Faculty of Business & Management" matches options
                        const facOptPartial = facultyOptions.find(f => 
                            initialData.faculty && (
                                f.label.includes(initialData.faculty.replace(/^Faculty of /, '')) ||
                                initialData.faculty.includes(f.label.replace(/^Faculty of /, ''))
                            )
                        );
                        if (facOptPartial) {
                            facultyIdValue = facOptPartial.value;
                        }
                    }
                }
                
                // Determine department ID - may need to look up by name if only name is provided
                let departmentIdValue = initialData.departmentId || "";
                if (!departmentIdValue && initialData.department) {
                    // Try exact match first
                    const deptOpt = departmentOptions.find(d => d.label === initialData.department);
                    if (deptOpt) {
                        departmentIdValue = deptOpt.value;
                    } else {
                        // Try matching by partial name
                        const deptByPartial = departmentOptions.find(d => 
                            d.label.toLowerCase().includes(initialData.department.toLowerCase())
                        );
                        if (deptByPartial) {
                            departmentIdValue = deptByPartial.value;
                        }
                    }
                    // If still not found, use departmentMap
                    if (!departmentIdValue) {
                        const foundDeptId = Object.keys(departmentMap).find(key => departmentMap[key].label === initialData.department);
                        if (foundDeptId) {
                            departmentIdValue = foundDeptId;
                        }
                    }
                }
                
                // Determine course ID - may need to look up by name if only name is provided
                let courseIdValue = initialData.courseId || "";
                if (!courseIdValue && initialData.course) {
                    // Try exact match first (full label)
                    const courseByLabel = courseOptions.find(c => c.label === initialData.course);
                    if (courseByLabel) {
                        courseIdValue = courseByLabel.value;
                    } else {
                        // Try matching by course code from courseCode field
                        if (initialData.courseCode) {
                            const courseByCode = courseOptions.find(c => 
                                c.label.startsWith(initialData.courseCode + ' -') ||
                                c.value === initialData.courseCode
                            );
                            if (courseByCode) {
                                courseIdValue = courseByCode.value;
                            }
                        }
                        
                        // Try matching by name containing
                        if (!courseIdValue) {
                            const courseByContains = courseOptions.find(c => 
                                c.label.toLowerCase().includes(initialData.course.toLowerCase())
                            );
                            if (courseByContains) {
                                courseIdValue = courseByContains.value;
                            }
                        }
                    }
                }
                
                // Student data format - convert to academicEntries
                newAcademicEntries = [{
                    id: "new-1",
                    course: courseIdValue || initialData.course || "",
                    courseCode: initialData.courseCode || "",
                    department: initialData.department || "",
                    departmentId: departmentIdValue || "",
                    faculty: facultyIdValue || "",
                    facultyCode: initialData.facultyCode || "",
                }];
                console.log('[DEBUG ProfileFormModal] Built academicEntries from simple fields:', JSON.stringify(newAcademicEntries));
            } else {
                newAcademicEntries = [{ id: "new-1", course: "", courseCode: "", department: "", departmentId: "", faculty: "", facultyCode: "" }];
                console.log('[DEBUG ProfileFormModal] No academic data found, using empty entries');
            }
            setAcademicEntries(newAcademicEntries);
            console.log('[DEBUG ProfileFormModal] Dropdown options available - facultyOptions:', facultyOptions.length, '| departmentOptions:', departmentOptions.length, '| courseOptions:', courseOptions.length, '| moduleOptions:', moduleOptions.length);
            console.log('[DEBUG ProfileFormModal] roleOptions:', roleOptions.map(r => ({ value: r.value, label: r.label })));
            console.log('[DEBUG ProfileFormModal] levelOptions:', levelOptions.map(l => ({ value: l.value, label: l.label })));
            
            if (initialData.campus) {
                setInternalActiveCampusTab(initialData.campus);
            }
        }
    }, [initialData]);

    // Re-sync academicEntries when dropdown options become available (for ID lookups)
    // Use refs to track if we've already resolved to avoid infinite loops
    const idResolutionRef = useRef<string | null>(null);
    useEffect(() => {
        // Only run if we have a valid record that needs resolution
        const recordId = initialData?.id;
        if (!recordId) return;
        if (idResolutionRef.current === recordId) return; // Already resolved for this record
        
        if (!initialData || Object.keys(initialData).length === 0) return;
        if (facultyOptions.length === 0 || departmentOptions.length === 0 || courseOptions.length === 0) return;
        
        // Only run if academicEntries exist and need ID resolution
        const entry = academicEntries[0];
        if (!entry) return;
        
        // Check if we need to resolve IDs from names
        let needsUpdate = false;
        const resolvedEntry = { ...entry };
        
        // Resolve faculty ID from name if needed
        if (entry.faculty && !entry.faculty.startsWith('f-') && !entry.faculty.includes('-0000-')) {
            const facOpt = facultyOptions.find(f => f.label === initialData.faculty);
            if (facOpt) {
                resolvedEntry.faculty = facOpt.value;
                needsUpdate = true;
            } else {
                // Try partial match
                const facOptPartial = facultyOptions.find(f => 
                    initialData.faculty && (
                        f.label.includes(initialData.faculty.replace(/^Faculty of /, '')) ||
                        initialData.faculty.includes(f.label.replace(/^Faculty of /, ''))
                    )
                );
                if (facOptPartial) {
                    resolvedEntry.faculty = facOptPartial.value;
                    needsUpdate = true;
                }
            }
        }
        
        // Resolve course ID from name if needed
        if (entry.course && !entry.course.startsWith('c-') && !entry.course.includes('-0000-')) {
            // Try exact match first
            const courseOpt = courseOptions.find(c => c.label === initialData.course);
            if (courseOpt) {
                resolvedEntry.course = courseOpt.value;
                needsUpdate = true;
            } else {
                // Try matching by name (after " - " separator)
                const courseByName = courseOptions.find(c => {
                    const namePart = c.label.split(' - ')[1];
                    return namePart && namePart.toLowerCase() === initialData.course.toLowerCase();
                });
                if (courseByName) {
                    resolvedEntry.course = courseByName.value;
                    needsUpdate = true;
                }
            }
        }
        
        if (needsUpdate) {
            idResolutionRef.current = recordId;
            console.log('[DEBUG ProfileFormModal] Resolving IDs from names - updating academicEntries:', JSON.stringify(resolvedEntry));
            setAcademicEntries([resolvedEntry]);
        }
    }, [initialData, facultyOptions.length, courseOptions.length]);

    // Initialize cascade filters when academicEntries change and options are available
    useEffect(() => {
        if (academicEntries.length > 0 && departmentOptions.length > 0) {
            academicEntries.forEach(entry => {
                updateCascadeFilters(entry.id, 'init', '');
            });
        }
    }, [academicEntries, departmentOptions.length, courseOptions.length, moduleOptions.length]);

    // Cascading filter state for each academic entry
    const [cascadeState, setCascadeState] = useState<Record<string, {
        filteredDepartments: Option[];
        filteredCourses: Option[];
        filteredModules: Option[];
    }>>({});

    // Update filtered options based on cascading selections
    const updateCascadeFilters = (entryId: string, field: string, value: string) => {
        setCascadeState(prev => {
            const entry = academicEntries.find(e => e.id === entryId);
            if (!entry) return prev;

            let currentFaculty = entry.faculty;
            let currentDepartmentId = entry.departmentId;
            let currentCourse = entry.course;

            // Handle the field being changed
            if (field === 'faculty') currentFaculty = value;
            if (field === 'departmentId') currentDepartmentId = value;
            if (field === 'course') currentCourse = value;

            // If department is selected, auto-populate faculty
            if (currentDepartmentId && departmentMap[currentDepartmentId]) {
                const deptData = departmentMap[currentDepartmentId];
                if (deptData && deptData.facultyId) {
                    currentFaculty = deptData.facultyId;
                }
            }

            // If course is selected, auto-populate department and faculty
            if (currentCourse && courseMap[currentCourse]) {
                const courseData = courseMap[currentCourse];
                if (courseData) {
                    currentDepartmentId = courseData.departmentId;
                    if (courseData.departmentId && departmentMap[courseData.departmentId]) {
                        const deptData = departmentMap[courseData.departmentId];
                        if (deptData && deptData.facultyId) {
                            currentFaculty = deptData.facultyId;
                        }
                    }
                }
            }

            // Build the entry with updated values
            const updatedEntry = {
                ...entry,
                [field]: value,
                faculty: currentFaculty,
                departmentId: currentDepartmentId,
                course: currentCourse
            };

            // Get department label for departmentId
            if (currentDepartmentId) {
                const deptOpt = departmentOptions.find(d => d.value === currentDepartmentId);
                if (deptOpt) {
                    updatedEntry.department = deptOpt.label;
                }
            }

            // Update academic entries with auto-populated values (skip for 'init' to avoid infinite loops)
            if (field !== 'init') {
                setAcademicEntries(entries => 
                    entries.map(e => e.id === entryId ? updatedEntry : e)
                );
            }

            // Filter departments by faculty
            let filteredDepartments = departmentOptions;
            if (currentFaculty) {
                filteredDepartments = departmentOptions.filter(d => {
                    const deptData = departmentMap[d.value];
                    return deptData && deptData.facultyId === currentFaculty;
                });
            }

            // Filter courses - by department OR by faculty if no department
            let filteredCourses = courseOptions;
            if (currentDepartmentId) {
                filteredCourses = courseOptions.filter(c => {
                    const courseData = courseMap[c.value];
                    return courseData && courseData.departmentId === currentDepartmentId;
                });
            } else if (currentFaculty) {
                // Get departments for this faculty
                const facultyDepts = departmentOptions.filter(d => {
                    const deptData = departmentMap[d.value];
                    return deptData && deptData.facultyId === currentFaculty;
                }).map(d => d.value);
                
                filteredCourses = courseOptions.filter(c => {
                    const courseData = courseMap[c.value];
                    return courseData && facultyDepts.includes(courseData.departmentId);
                });
            }

            // Filter modules - by course OR by department OR by faculty
            let filteredModules = moduleOptions;
            if (currentCourse) {
                filteredModules = moduleOptions.filter(m => {
                    const modData = moduleMap[m.value];
                    return modData && modData.courseId === currentCourse;
                });
            } else if (currentDepartmentId) {
                filteredModules = moduleOptions.filter(m => {
                    const modData = moduleMap[m.value];
                    return modData && modData.departmentId === currentDepartmentId;
                });
            } else if (currentFaculty) {
                const facultyDepts = departmentOptions.filter(d => {
                    const deptData = departmentMap[d.value];
                    return deptData && deptData.facultyId === currentFaculty;
                }).map(d => d.value);
                
                filteredModules = moduleOptions.filter(m => {
                    const modData = moduleMap[m.value];
                    return modData && facultyDepts.includes(modData.departmentId);
                });
            }

            return {
                ...prev,
                [entryId]: { filteredDepartments, filteredCourses, filteredModules }
            };
        });
    };

    // Initialize cascade state for each entry (only set defaults for new entries, no updateCascadeFilters call)
    useEffect(() => {
        academicEntries.forEach(entry => {
            if (!cascadeState[entry.id]) {
                setCascadeState(prev => ({
                    ...prev,
                    [entry.id]: {
                        filteredDepartments: departmentOptions,
                        filteredCourses: courseOptions,
                        filteredModules: moduleOptions
                    }
                }));
            }
        });
    }, [academicEntries.length, departmentOptions.length, courseOptions.length, moduleOptions.length]);

    // FIX: Reset form state when mode changes to "add" or when modal opens in add mode
    // This prevents stale data from View modal leaking into Add modal
    const prevModeRef = useRef<string>(mode);
    const prevOpenRef = useRef<boolean>(open);
    useEffect(() => {
        // Reset form when transitioning to add mode OR when opening modal in add mode
        const isModeChangeToAdd = prevModeRef.current !== "add" && mode === "add";
        const isOpenInAddMode = !prevOpenRef.current && open && mode === "add";

        if (isModeChangeToAdd || isOpenInAddMode) {
            console.log('[DEBUG ProfileFormModal] Resetting form state for add mode');
            setPersonalInfo({
                title: "",
                initials: "",
                idNumber: "",
                firstName: "",
                lastName: "",
                email: "",
                location: "",
                staffNumber: "",
                campus: "",
            });
            setRoleInfo({ role: "", level: "" });
            setAdditionalInfo({ extracurricular: "", residence: "" });
            setSelectedModules([]);
            setAcademicEntries([{ id: "new-1", course: "", courseCode: "", department: "", departmentId: "", faculty: "", facultyCode: "" }]);
            setCascadeState({});
            // When no external campus tab prop is provided, reset to first option
            if (!onCampusTabChange && campusOptions.length > 0) {
                setInternalActiveCampusTab(campusOptions[0].label);
            }
        }

        prevModeRef.current = mode;
        prevOpenRef.current = open;
    }, [mode, open]);

    // FIX: Sync internal campus tab with external prop when modal opens or external tab changes
    useEffect(() => {
        if (onCampusTabChange && activeCampusTab !== undefined && activeCampusTab !== "") {
            setInternalActiveCampusTab(activeCampusTab);
        }
    }, [activeCampusTab, open, onCampusTabChange]);

    const addAcademicEntry = () => {
        setAcademicEntries([
            ...academicEntries,
            { id: `new-${Date.now()}`, course: "", courseCode: "", department: "", departmentId: "", faculty: "", facultyCode: "" }
        ]);
    };

    const updateAcademicEntry = (id: string, field: string, value: string) => {
        setAcademicEntries(entries =>
            entries.map(entry => {
                if (entry.id !== id) return entry;
                
                const updated = { ...entry, [field]: value };
                
                if (field === 'course' && value && courseMap[value]) {
                    const courseData = courseMap[value];
                    const deptOpt = departmentOptions.find(d => d.value === courseData.departmentId);
                    if (deptOpt) {
                        updated.departmentId = courseData.departmentId;
                        updated.department = deptOpt.label;
                        const deptData = departmentMap[courseData.departmentId];
                        if (deptData && deptData.facultyId) {
                            const facOpt = facultyOptions.find(f => f.value === deptData.facultyId);
                            if (facOpt) {
                                updated.faculty = deptData.facultyId;
                                updated.facultyCode = facOpt.value;
                            }
                        }
                    }
                }
                
                if (field === 'departmentId' && value && departmentMap[value]) {
                    const deptData = departmentMap[value];
                    const facOpt = facultyOptions.find(f => f.value === deptData.facultyId);
                    if (facOpt) {
                        updated.faculty = deptData.facultyId;
                        updated.facultyCode = facOpt.value;
                    }
                }
                
                return updated;
            })
        );
    };

    const [isSaving, setIsSaving] = useState(false);

    const filteredModules = useMemo(() => {
        if (!moduleSearch) return moduleOptions.slice(0, 10);
        return moduleOptions
            .filter(m =>
                m.label.toLowerCase().includes(moduleSearch.toLowerCase()) ||
                m.value.toLowerCase().includes(moduleSearch.toLowerCase())
            )
            .slice(0, 10);
    }, [moduleSearch, moduleOptions]);

    const addModule = (moduleValue: string) => {
        console.log('[DEBUG addModule] Adding module:', moduleValue, '| current selected:', selectedModules);
        
        // Normalize moduleValue to string
        const normalizedValue = String(moduleValue);
        const stringSelected = selectedModules.map(m => String(m));
        
        if (moduleValue && !stringSelected.includes(normalizedValue)) {
            setSelectedModules([...selectedModules, normalizedValue]);
            setModuleSearch("");
            setShowModuleDropdown(false);
            
            // Auto-populate course, department, and faculty based on selected module
            const modData = moduleMap[moduleValue];
            if (modData && academicEntries.length > 0) {
                const firstEntry = academicEntries[0];
                
                setAcademicEntries(entries =>
                    entries.map(e => {
                        if (e.id !== firstEntry.id) return e;
                        let updated = { ...e };
                        
                        // Auto-fill course
                        if (modData.courseId) {
                            const courseOpt = courseOptions.find(c => c.value === modData.courseId);
                            if (courseOpt) {
                                updated.course = modData.courseId;
                            }
                        }
                        
                        // Auto-fill department
                        if (modData.departmentId) {
                            const deptOpt = departmentOptions.find(d => d.value === modData.departmentId);
                            if (deptOpt) {
                                updated.departmentId = modData.departmentId;
                                updated.department = deptOpt.label;
                            }
                        }
                        
                        // Auto-fill faculty from department
                        if (modData.departmentId && departmentMap[modData.departmentId]) {
                            const deptData = departmentMap[modData.departmentId];
                            if (deptData && deptData.facultyId) {
                                updated.faculty = deptData.facultyId;
                            }
                        }
                        
                        return updated;
                    })
                );
                
                // Update cascade filters
                updateCascadeFilters(firstEntry.id, 'course', modData.courseId || '');
            }
        }
    };

    const removeModule = (moduleValue: string) => {
        console.log('[DEBUG removeModule] Removing module:', moduleValue);
        const normalizedValue = String(moduleValue);
        setSelectedModules(selectedModules.filter(m => String(m) !== normalizedValue));
    };

    const getModuleLabel = (moduleValue: string) => {
        console.log('[DEBUG getModuleLabel] Looking for:', moduleValue, '| options length:', moduleOptions.length);
        
        if (moduleOptions.length === 0) {
            return moduleValue + ' (no options)';
        }
        
        // Direct lookup
        const module = moduleOptions.find(m => {
            const match = m.value === moduleValue;
            return match;
        });
        
        if (module) {
            console.log('[DEBUG getModuleLabel] Found:', module.label);
            return module.label;
        }
        
        // Debug: log first few options
        console.log('[DEBUG getModuleLabel] First few options:', moduleOptions.slice(0, 3).map(m => m.value));
        
        return moduleValue;
    };

    const handleSave = async () => {
        if (!onSave) return;
        setIsSaving(true);
        try {
            const completeData = {
                ...personalInfo,
                ...additionalInfo,
                ...roleInfo,
                campus: activeCampus,
                modules: selectedModules,
                academicEntries: academicEntries,
                staffId: personalInfo.staffNumber,
                studentId: isStudent ? personalInfo.staffNumber : undefined,
                image: profileImage,
            };
            await onSave(completeData);
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        onOpenChange(false);
    };

    const getInputClasses = (value: string) => cn(
        "bg-background rounded-lg transition-all duration-200 focus:border focus:border-[#E8E8E8] focus:bg-[#F8F8F8] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none",
        value ? "border border-[#E8E8E8] bg-[#F8F8F8]" : "border border-[#E8E8E8]"
    );

    const getSelectClasses = (value: string) => cn(
        "bg-background rounded-lg transition-all duration-200 focus:border focus:border-[#E8E8E8] focus:bg-[#F8F8F8] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus-visible:outline-none data-[state=open]:border data-[state=open]:border-[#E8E8E8] data-[state=open]:bg-background",
        value ? "border border-[#E8E8E8] bg-background" : "border border-[#E8E8E8]"
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "border-none shadow-lg modal-content-scroll",
                isExpanded 
                    ? "max-w-[90vw] max-h-[90vh] overflow-y-auto overflow-x-hidden" 
                    : "max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden"
            )} style={{ backgroundColor: 'hsl(var(--card))' }}>
                <DialogHeader className="space-y-4 px-6 pt-6">
                    <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {campusOptions.length > 0 && (
                    <div className="px-6 border-b border-border">
                        <div
                            ref={tabListRef}
                            className="flex items-center gap-2 overflow-x-auto modal-tabs-scrollbar flex-shrink-0"
                            role="tablist"
                            aria-label="Campus"
                        >
                            {campusOptions.map((campus, index) => (
                                <ModalTabButton
                                    key={campus.value}
                                    label={campus.label}
                                    isActive={activeCampus === campus.label}
                                    onClick={() => setActiveCampus(campus.label)}
                                    onKeyDown={isReadOnly ? undefined : (e) => handleTabKeyDown(e, index)}
                                    disabled={isReadOnly}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-6 pb-6 space-y-8">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Personal Information</h3>
                        
{/* Photo Upload */}
<div className="flex items-center gap-4 mb-4">
    {profileImage ? (
        <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
    ) : (
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground">
            {personalInfo.initials || (personalInfo.firstName[0] || "") + (personalInfo.lastName[0] || "")}
        </div>
    )}
    {!isReadOnly && (
        <ImageUploadField
            value={profileImage}
            onChange={(url) => setProfileImage(url)}
            label="Profile Picture"
            placeholder="JPG, PNG or GIF • Max 5MB"
            contextId={isStudent ? personalInfo.staffNumber : personalInfo.staffNumber}
            contextType={isStudent ? 'student' : 'staff'}
        />
    )}
</div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Select value={personalInfo.title} onValueChange={(v) => setPersonalInfo({ ...personalInfo, title: v })} disabled={isReadOnly}>
                                    <SelectTrigger className={getSelectClasses(personalInfo.title)}>
                                        <SelectValue>{personalInfo.title || "Select title"}</SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border border-[#E8E8E8] z-50">
                                        {titleOptions.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Initials</Label>
                                <Input
                                    value={personalInfo.initials}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, initials: e.target.value })}
                                    disabled={isReadOnly}
                                    className={getInputClasses(personalInfo.initials)}
                                    placeholder="G"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>ID/Passport Number</Label>
                                <Input
                                    value={personalInfo.idNumber}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, idNumber: e.target.value })}
                                    disabled={isReadOnly}
                                    className={getInputClasses(personalInfo.idNumber)}
                                    placeholder="Enter ID or passport number"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={personalInfo.firstName}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                                    disabled={isReadOnly}
                                    className={getInputClasses(personalInfo.firstName)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={personalInfo.lastName}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                                    disabled={isReadOnly}
                                    className={getInputClasses(personalInfo.lastName)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input
                                    type="email"
                                    value={personalInfo.email}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                                    disabled={isReadOnly}
                                    className={getInputClasses(personalInfo.email)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Input
                                    value={personalInfo.location}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                                    disabled={isReadOnly}
                                    className={getInputClasses(personalInfo.location)}
                                    placeholder="Enter location"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{isStaff ? "Staff Number" : "Student Number"}</Label>
                                <Input
                                    value={personalInfo.staffNumber}
                                    onChange={(e) => setPersonalInfo({ ...personalInfo, staffNumber: e.target.value })}
                                    disabled={isReadOnly}
                                    className={getInputClasses(personalInfo.staffNumber)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Campus</Label>
                                {campusOptions.length > 0 ? (
                                    isReadOnly ? (
                                        <div className="px-3 py-2 bg-muted/30 rounded-lg text-foreground font-medium">
                                            {activeCampus}
                                        </div>
                                    ) : (
                                        <div className="px-3 py-2 bg-muted/30 rounded-lg text-foreground font-medium border border-dashed border-muted-foreground/30">
                                            {activeCampus}
                                        </div>
                                    )
                                ) : (
                                    <Select value={personalInfo.campus} onValueChange={(v) => setPersonalInfo({ ...personalInfo, campus: v })} disabled={isReadOnly}>
                                        <SelectTrigger className={getSelectClasses(personalInfo.campus)}>
                                            <SelectValue placeholder="Select campus" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border border-[#E8E8E8] z-50">
                                            {campusOptions.map(c => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {/* Role and Level for Staff */}
                        {(isStaff || roleInfo.role || roleInfo.level) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={roleInfo.role} onValueChange={(v) => setRoleInfo({ ...roleInfo, role: v })} disabled={isReadOnly}>
                                        <SelectTrigger className={getSelectClasses(roleInfo.role)}>
                                            <SelectValue>{roleInfo.role || "Select role"}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border border-[#E8E8E8] z-50">
                                            {roleOptions.map(r => (
                                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Level</Label>
                                    <Select value={roleInfo.level} onValueChange={(v) => setRoleInfo({ ...roleInfo, level: v })} disabled={isReadOnly}>
                                        <SelectTrigger className={getSelectClasses(roleInfo.level)}>
                                            <SelectValue>{roleInfo.level || "Select level"}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border border-[#E8E8E8] z-50">
                                            {levelOptions.map(l => (
                                                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Academic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Academic Information</h3>
                        
                        {academicEntries.map((entry, index) => {
                            const cascade = cascadeState[entry.id] || { filteredDepartments: departmentOptions, filteredCourses: courseOptions, filteredModules: moduleOptions };
                            return (
                            <div key={entry.id} className="space-y-4 p-4 bg-muted/30 rounded-lg">
                                {academicEntries.length > 1 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-muted-foreground">Set {index + 1}</span>
                                        {!isReadOnly && (
                                            <Button 
                                                type="button" 
                                                onClick={() => setAcademicEntries(entries => entries.filter(e => e.id !== entry.id))} 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-destructive h-6 px-2"
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormSelect
                                        label="Faculty"
                                        value={entry.faculty}
                                        onChange={(v) => {
                                            setAcademicEntries(entries =>
                                                entries.map(e => {
                                                    if (e.id !== entry.id) return e;
                                                    let updated = { ...e, faculty: v };
                                                    // Auto-populate department from faculty
                                                    if (v) {
                                                        const relevantDepts = departmentOptions.filter(d => {
                                                            const deptData = departmentMap[d.value];
                                                            return deptData && deptData.facultyId === v;
                                                        });
                                                        if (relevantDepts.length > 0) {
                                                            updated.departmentId = relevantDepts[0].value;
                                                            updated.department = relevantDepts[0].label;
                                                        }
                                                    }
                                                    return updated;
                                                })
                                            );
                                            updateCascadeFilters(entry.id, 'faculty', v);
                                        }}
                                        options={facultyOptions}
                                        placeholder="Select faculty"
                                        required
                                        searchable
                                        disabled={isReadOnly}
                                    />
                                    <FormSelect
                                        label="Department"
                                        value={entry.departmentId}
                                        onChange={(v) => {
                                            setAcademicEntries(entries =>
                                                entries.map(e => {
                                                    if (e.id !== entry.id) return e;
                                                    let updated = { ...e, departmentId: v };
                                                    // Auto-populate faculty from department
                                                    if (v && departmentMap[v]) {
                                                        const deptData = departmentMap[v];
                                                        if (deptData && deptData.facultyId) {
                                                            updated.faculty = deptData.facultyId;
                                                        }
                                                    }
                                                    return updated;
                                                })
                                            );
                                            updateCascadeFilters(entry.id, 'departmentId', v);
                                        }}
                                        options={cascade.filteredDepartments}
                                        placeholder="Select department"
                                        required
                                        searchable
                                        disabled={isReadOnly}
                                    />
                                    <FormSelect
                                        label="Course"
                                        value={entry.course}
                                        onChange={(v) => {
                                            setAcademicEntries(entries =>
                                                entries.map(e => {
                                                    if (e.id !== entry.id) return e;
                                                    let updated = { ...e, course: v };
                                                    // Auto-populate department and faculty from course
                                                    if (v && courseMap[v]) {
                                                        const courseData = courseMap[v];
                                                        if (courseData) {
                                                            updated.departmentId = courseData.departmentId;
                                                            const deptOpt = departmentOptions.find(d => d.value === courseData.departmentId);
                                                            if (deptOpt) {
                                                                updated.department = deptOpt.label;
                                                            }
                                                            if (courseData.departmentId && departmentMap[courseData.departmentId]) {
                                                                const deptData = departmentMap[courseData.departmentId];
                                                                if (deptData && deptData.facultyId) {
                                                                    updated.faculty = deptData.facultyId;
                                                                }
                                                            }
                                                        }
                                                    }
                                                    return updated;
                                                })
                                            );
                                            updateCascadeFilters(entry.id, 'course', v);
                                        }}
                                        options={cascade.filteredCourses}
                                        placeholder="Select course"
                                        required
                                        searchable
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                            );
                        })}

                        {isStaff && !isReadOnly && (
                            <Button type="button" onClick={addAcademicEntry} variant="ghost" size="sm" className="text-primary pl-0">
                                + Add More
                            </Button>
                        )}
                    </div>

                    {/* Modules Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Modules</h3>
                        
                        {/* Get module filters from first academic entry or use all */}
                        {(() => {
                            const firstEntry = academicEntries[0];
                            const cascade = firstEntry ? (cascadeState[firstEntry.id] || { filteredModules: moduleOptions }) : { filteredModules: moduleOptions };
                            const availableModules = cascade.filteredModules;
                            
                            const moduleFilteredForSearch = useMemo(() => {
                                if (!moduleSearch) return availableModules.slice(0, 10);
                                return availableModules
                                    .filter(m =>
                                        m.label.toLowerCase().includes(moduleSearch.toLowerCase()) ||
                                        m.value.toLowerCase().includes(moduleSearch.toLowerCase())
                                    )
                                    .slice(0, 10);
                            }, [moduleSearch, availableModules]);
                            
                            return (
                        <div className="space-y-2">
                            <Label>Search and Add Modules</Label>
                            <div className="relative">
                                <Input
                                    ref={moduleInputRef}
                                    value={moduleSearch}
                                    onChange={(e) => {
                                        setModuleSearch(e.target.value);
                                        setShowModuleDropdown(true);
                                    }}
                                    onFocus={() => setShowModuleDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowModuleDropdown(false), 150)}
                                    disabled={isReadOnly}
                                    placeholder="Search modules..."
                                    className={getInputClasses(moduleSearch)}
                                />
                                {showModuleDropdown && moduleFilteredForSearch.length > 0 && !isReadOnly && (
                                    <div 
                                        className="absolute z-50 w-full mt-1 bg-background border border-[#E8E8E8] rounded-lg shadow-lg max-h-48 overflow-y-auto"
                                    >
                                        {moduleFilteredForSearch.map(module => {
                                            const isSelected = selectedModules.includes(String(module.value));
                                            return (
                                                <div
                                                    key={module.value}
                                                    className={cn(
                                                        "px-4 py-2 cursor-pointer border-b border-[#E8E8E8] last:border-b-0",
                                                        isSelected ? "bg-primary/10 cursor-default" : "hover:bg-primary/10"
                                                    )}
                                                    onMouseDown={() => {
                                                        console.log('[DEBUG ProfileFormModal] Module clicked:', module.value, '| isSelected:', isSelected);
                                                        !isSelected && addModule(module.value);
                                                    }}
                                                >
                                                    <div className={cn("font-medium", isSelected && "text-primary")}>
                                                        {isSelected && <Check className="inline-block w-4 h-4 mr-1" />}
                                                        {module.label}
                                                        {isSelected && " (selected)"}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                            );
                        })()}

                        {selectedModules.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedModules.map(moduleValue => {
                                    // Find module - try direct match first
                                    let modLabel = moduleOptions.find(m => m.value === moduleValue)?.label;
                                    
                                    // If no match, try partial match (handles cases where database has different IDs)
                                    if (!modLabel) {
                                        // Try matching last part of IDs (after last hyphen)
                                        const moduleValueSuffix = moduleValue.split('-').pop();
                                        const found = moduleOptions.find(m => {
                                            const optSuffix = m.value.split('-').pop();
                                            return optSuffix === moduleValueSuffix;
                                        });
                                        modLabel = found?.label;
                                    }
                                    
                                    return (
                                    <div key={moduleValue} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm">
                                        <span className="font-medium">
                                            {modLabel || moduleValue}
                                        </span>
                                        {!isReadOnly && (
                                            <button type="button" onClick={() => removeModule(moduleValue)} className="ml-1 p-0.5 hover:bg-primary/20 rounded-full">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                )})}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground">Selected: {selectedModules.length} module(s)</p>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Additional Information</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Extracurricular Activities</Label>
                                {isReadOnly ? (
                                    <div className="px-3 py-2 bg-muted/30 rounded-lg text-foreground font-medium">
                                        {additionalInfo.extracurricular || "—"}
                                    </div>
                                ) : (
                                    <Select value={additionalInfo.extracurricular} onValueChange={(v) => setAdditionalInfo({ ...additionalInfo, extracurricular: v })} disabled={isReadOnly}>
                                        <SelectTrigger className={getSelectClasses(additionalInfo.extracurricular)}>
                                            <SelectValue placeholder="Select activity" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border border-[#E8E8E8] z-50">
                                            {extracurricularOptions.map(ext => (
                                                <SelectItem key={ext.value} value={ext.value}>{ext.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>School Provided Residence</Label>
                                {isReadOnly ? (
                                    <div className="px-3 py-2 bg-muted/30 rounded-lg text-foreground font-medium">
                                        {additionalInfo.residence || "—"}
                                    </div>
                                ) : (
                                    <Select value={additionalInfo.residence} onValueChange={(v) => setAdditionalInfo({ ...additionalInfo, residence: v })} disabled={isReadOnly}>
                                        <SelectTrigger className={getSelectClasses(additionalInfo.residence)}>
                                            <SelectValue placeholder="Select residence" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-background border border-[#E8E8E8] z-50">
                                            {residenceOptions.map(res => (
                                                <SelectItem key={res.value} value={res.value}>{res.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 pt-4 border-t border-border">
                        <Button onClick={handleCancel} variant="outline" className="w-32 h-12 text-base font-semibold rounded-lg">
                            {isReadOnly ? "Close" : "Cancel"}
                        </Button>
                        {!isReadOnly && (
                            <Button
                                onClick={handleSave}
                                className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold rounded-lg shadow-lg shadow-primary/30"
                                disabled={isSaving || isLoading}
                            >
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
