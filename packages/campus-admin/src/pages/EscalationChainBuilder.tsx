import { useEffect, useMemo, useState } from "react";
import { GripVertical, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
    ApiError,
    roleApi,
    RoleData,
    campusApi,
    CampusData,
    facultyApi,
    FacultyData,
    departmentApi,
    DepartmentData,
    courseApi,
    CourseData,
    moduleApi,
    ModuleData,
    officeApi,
    OfficeData,
    escalationChainApi,
    EscalationChainData,
    escalationChainStepApi,
    EscalationChainStepData,
} from "@/services/adminApi";

function prettifyKey(key: string): string {
    return key
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function chainLabel(chain: EscalationChainData): string {
    const base = prettifyKey(chain.category_key);
    return chain.variant ? `${base} (${prettifyKey(chain.variant)})` : base;
}

interface CascadeSectionProps {
    title: string;
    search?: string;
    onSearchChange?: (value: string) => void;
    items: { id: string; label: string }[];
    selectedId: string;
    onSelect: (id: string) => void;
}

function CascadeSection({ title, search, onSearchChange, items, selectedId, onSelect }: CascadeSectionProps) {
    return (
        <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            {onSearchChange && (
                <Input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={`Search ${title.toLowerCase()}...`}
                    className="h-9 text-sm"
                />
            )}
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {items.length === 0 && (
                    <p className="text-xs text-muted-foreground py-1">No options available</p>
                )}
                {items.map((item) => (
                    <label
                        key={item.id}
                        className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/40 cursor-pointer text-sm"
                    >
                        <Checkbox
                            checked={selectedId === item.id}
                            onCheckedChange={() => onSelect(selectedId === item.id ? "" : item.id)}
                            className="border-gray-300 data-[state=checked]:border-primary"
                        />
                        <span className="text-foreground">{item.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

interface EscalationChainBuilderProps {
    onCancel?: () => void;
}

export function EscalationChainBuilder({ onCancel }: EscalationChainBuilderProps) {
    const { toast } = useToast();

    const [chains, setChains] = useState<EscalationChainData[]>([]);
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [campuses, setCampuses] = useState<CampusData[]>([]);
    const [faculties, setFaculties] = useState<FacultyData[]>([]);
    const [departments, setDepartments] = useState<DepartmentData[]>([]);
    const [courses, setCourses] = useState<CourseData[]>([]);
    const [modules, setModules] = useState<ModuleData[]>([]);
    const [offices, setOffices] = useState<OfficeData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedChainId, setSelectedChainId] = useState("");
    const [selectedCampusId, setSelectedCampusId] = useState("");
    const [selectedFacultyId, setSelectedFacultyId] = useState("");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedModuleId, setSelectedModuleId] = useState("");
    const [selectedOfficeId, setSelectedOfficeId] = useState("");

    const [steps, setSteps] = useState<EscalationChainStepData[]>([]);
    const [originalSteps, setOriginalSteps] = useState<EscalationChainStepData[]>([]);
    const [deletedStepIds, setDeletedStepIds] = useState<Set<string>>(new Set());
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const [chainsRes, rolesRes, campusesRes, facultiesRes, departmentsRes, coursesRes, modulesRes, officesRes] =
                    await Promise.all([
                        escalationChainApi.list("", 1, 100),
                        roleApi.list("", 1, 100),
                        campusApi.list("", 1, 100),
                        facultyApi.list("", 1, 100),
                        departmentApi.list("", 1, 200),
                        courseApi.list("", 1, 300),
                        moduleApi.list("", 1, 500),
                        officeApi.list("", 1, 200),
                    ]);
                setChains(chainsRes.data);
                setRoles(rolesRes.data);
                setCampuses(campusesRes.data);
                setFaculties(facultiesRes.data);
                setDepartments(departmentsRes.data);
                setCourses(coursesRes.data);
                setModules(modulesRes.data);
                setOffices(officesRes.data);
            } catch (error) {
                toast({
                    title: "Error",
                    description: error instanceof ApiError ? error.message : "Failed to load escalation data",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const selectedChain = useMemo(
        () => chains.find((c) => c.id === selectedChainId) || null,
        [chains, selectedChainId]
    );
    const isAcademic = selectedChain ? selectedChain.scope_type !== "office" : true;

    const roleLabel = (roleId: string) => {
        const role = roles.find((r) => r.id === roleId);
        return role ? `${role.role}` : roleId;
    };

    const loadSteps = async (chainId: string) => {
        try {
            setIsLoading(true);
            const result = await escalationChainStepApi.list("", 1, 100);
            const chainSteps = result.data
                .filter((s) => s.chain_id === chainId)
                .sort((a, b) => parseInt(a.step_order) - parseInt(b.step_order));
            setSteps(chainSteps);
            setOriginalSteps(chainSteps);
            setDeletedStepIds(new Set());
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load chain steps",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectChain = (id: string) => {
        setSelectedChainId(id);
        setSelectedCampusId("");
        setSelectedFacultyId("");
        setSelectedDepartmentId("");
        setSelectedCourseId("");
        setSelectedModuleId("");
        setSelectedOfficeId("");
        if (id) loadSteps(id);
        else {
            setSteps([]);
            setOriginalSteps([]);
            setDeletedStepIds(new Set());
        }
    };

    const filteredChains = chains;

    const facultyOptions = faculties.map((f) => ({ id: f.id, label: f.name }));
    const departmentOptions = departments
        .filter((d) => !selectedFacultyId || d.facultyId === selectedFacultyId)
        .map((d) => ({ id: d.id, label: d.name }));
    const courseOptions = courses
        .filter((c) => !selectedDepartmentId || c.departmentId === selectedDepartmentId)
        .map((c) => ({ id: c.id, label: c.name }));
    const moduleOptions = modules
        .filter((m) => !selectedDepartmentId || m.departmentId === selectedDepartmentId)
        .map((m) => ({ id: m.id, label: m.name }));
    const officeOptions = offices
        .filter(
            (o) =>
                (!selectedChain || o.category_key === selectedChain.category_key) &&
                (!selectedCampusId || o.campus_id === selectedCampusId)
        )
        .map((o) => ({ id: o.id, label: o.name }));

    const contextParts = [
        campuses.find((c) => c.id === selectedCampusId)?.name,
        isAcademic ? faculties.find((f) => f.id === selectedFacultyId)?.name : undefined,
        isAcademic
            ? departments.find((d) => d.id === selectedDepartmentId)?.name
            : offices.find((o) => o.id === selectedOfficeId)?.name,
        isAcademic ? courses.find((c) => c.id === selectedCourseId)?.name : undefined,
        isAcademic ? modules.find((m) => m.id === selectedModuleId)?.name : undefined,
    ].filter(Boolean);

    const visibleSteps = steps.filter((s) => !deletedStepIds.has(s.id));

    const handleRemoveStep = (stepId: string) => {
        setDeletedStepIds((prev) => new Set(prev).add(stepId));
    };

    const handleDrop = (targetIndex: number) => {
        if (dragIndex === null || dragIndex === targetIndex) {
            setDragIndex(null);
            return;
        }
        const reordered = [...visibleSteps];
        const [moved] = reordered.splice(dragIndex, 1);
        reordered.splice(targetIndex, 0, moved);
        // Merge back with any deleted steps left untouched, preserving relative order
        setSteps(reordered.concat(steps.filter((s) => deletedStepIds.has(s.id))));
        setDragIndex(null);
    };

    const isDirty =
        deletedStepIds.size > 0 ||
        visibleSteps.some((s, i) => s.id !== originalSteps.filter((os) => !deletedStepIds.has(os.id))[i]?.id);

    const handleReset = () => {
        setSteps(originalSteps);
        setDeletedStepIds(new Set());
    };

    const handleSave = async () => {
        if (!selectedChain) return;
        try {
            setIsSaving(true);

            for (const id of Array.from(deletedStepIds)) {
                await escalationChainStepApi.delete(id);
            }

            for (let i = 0; i < visibleSteps.length; i++) {
                const step = visibleSteps[i];
                const newOrder = i + 1;
                if (parseInt(step.step_order) !== newOrder) {
                    await escalationChainStepApi.update(step.id, { step_order: String(newOrder) });
                }
            }

            toast({ title: "Escalation chain saved" });
            await loadSteps(selectedChain.id);
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof ApiError ? error.message : "Failed to save chain",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-card rounded-lg shadow-sm flex flex-col h-full">
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-200">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Manage Roles</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select a category to configure its escalation chain of command.
                    </p>
                </div>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200 overflow-hidden">
                {/* LEFT COLUMN — Column Options */}
                <div className="p-6 space-y-6 overflow-y-auto admin-table">
                    <h3 className="text-lg font-semibold text-foreground">Column Options</h3>

                    <CascadeSection
                        title="Category"
                        items={filteredChains.map((c) => ({ id: c.id, label: chainLabel(c) }))}
                        selectedId={selectedChainId}
                        onSelect={handleSelectChain}
                    />

                    {selectedChainId && (
                        <CascadeSection
                            title="Campus"
                            items={campuses.map((c) => ({ id: c.id, label: c.name }))}
                            selectedId={selectedCampusId}
                            onSelect={(id) => {
                                setSelectedCampusId(id);
                                setSelectedFacultyId("");
                                setSelectedDepartmentId("");
                                setSelectedCourseId("");
                                setSelectedModuleId("");
                                setSelectedOfficeId("");
                            }}
                        />
                    )}

                    {selectedCampusId && isAcademic && (
                        <CascadeSection
                            title="Faculty"
                            items={facultyOptions}
                            selectedId={selectedFacultyId}
                            onSelect={(id) => {
                                setSelectedFacultyId(id);
                                setSelectedDepartmentId("");
                                setSelectedCourseId("");
                                setSelectedModuleId("");
                            }}
                        />
                    )}

                    {selectedCampusId && !isAcademic && (
                        <CascadeSection
                            title="Office"
                            items={officeOptions}
                            selectedId={selectedOfficeId}
                            onSelect={setSelectedOfficeId}
                        />
                    )}

                    {isAcademic && selectedFacultyId && (
                        <CascadeSection
                            title="Department"
                            items={departmentOptions}
                            selectedId={selectedDepartmentId}
                            onSelect={(id) => {
                                setSelectedDepartmentId(id);
                                setSelectedCourseId("");
                                setSelectedModuleId("");
                            }}
                        />
                    )}

                    {isAcademic && selectedDepartmentId && (
                        <CascadeSection
                            title="Course"
                            items={courseOptions}
                            selectedId={selectedCourseId}
                            onSelect={setSelectedCourseId}
                        />
                    )}

                    {isAcademic && selectedDepartmentId && (
                        <CascadeSection
                            title="Module"
                            items={moduleOptions}
                            selectedId={selectedModuleId}
                            onSelect={setSelectedModuleId}
                        />
                    )}
                </div>

                {/* RIGHT COLUMN — Chain of Command */}
                <div className="p-6 space-y-4 overflow-y-auto relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-background/40 flex items-center justify-center z-10">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}

                    {!selectedChain ? (
                        <p className="text-sm text-muted-foreground">Select a category on the left to view its escalation chain.</p>
                    ) : (
                        <>
                            <div>
                                <h3 className="text-xl font-bold text-foreground">{chainLabel(selectedChain)}</h3>
                                {contextParts.length > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">{contextParts.join(" - ")}</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                {visibleSteps.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No steps configured for this chain yet.</p>
                                )}
                                {visibleSteps.map((step, index) => (
                                    <div
                                        key={step.id}
                                        draggable
                                        onDragStart={() => setDragIndex(index)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => handleDrop(index)}
                                        className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3 shadow-sm cursor-grab active:cursor-grabbing"
                                    >
                                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-foreground text-xs font-bold shrink-0">
                                            {index + 1}
                                        </span>
                                        <span className="flex-1 text-sm font-medium text-foreground">{roleLabel(step.role_id)}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveStep(step.id)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors"
                                            aria-label="Remove step"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* BOTTOM ACTION BAR */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handleReset}
                    disabled={!selectedChain || !isDirty}
                    className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Reset to default
                </button>
                <div className="flex items-center gap-3">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!selectedChain || !isDirty || isSaving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
}
