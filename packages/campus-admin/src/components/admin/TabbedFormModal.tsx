import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModalTabButton } from "./ModalTabButton";
import { useRef, useCallback } from "react";

interface TabbedFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    tabs: string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaveDisabled?: boolean;
    children: React.ReactNode;
}

export function TabbedFormModal({
    open,
    onOpenChange,
    title,
    tabs,
    activeTab,
    onTabChange,
    onSave,
    onCancel,
    isSaveDisabled = false,
    children,
}: TabbedFormModalProps) {
    const tabListRef = useRef<HTMLDivElement>(null);

    // Keyboard navigation for modal tabs
    const handleTabKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
        let newIndex = currentIndex;

        switch (e.key) {
            case "ArrowRight":
                e.preventDefault();
                newIndex = (currentIndex + 1) % tabs.length;
                break;
            case "ArrowLeft":
                e.preventDefault();
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                break;
            case "Home":
                e.preventDefault();
                newIndex = 0;
                break;
            case "End":
                e.preventDefault();
                newIndex = tabs.length - 1;
                break;
            default:
                return;
        }

        const tabButtons = tabListRef.current?.querySelectorAll("[role='tab']");
        (tabButtons?.[newIndex] as HTMLButtonElement)?.focus();
        onTabChange(tabs[newIndex]);
    }, [tabs, onTabChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl border-none shadow-lg max-h-[85vh] overflow-y-auto modal-content-scroll"
                style={{ backgroundColor: 'hsl(var(--card))' }}
            >
                <DialogHeader className="space-y-4 px-6 pt-6">
                    <DialogTitle className="text-3xl font-bold text-foreground tracking-tight">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {/* Modal Tabs */}
                <div className="px-6 border-b border-border">
                    <div
                        ref={tabListRef}
                        className="flex items-center gap-2 overflow-x-auto"
                        role="tablist"
                        aria-label="Categories"
                    >
                    {tabs.map((tab, index) => (
                        <ModalTabButton
                            key={tab}
                            label={tab}
                            isActive={activeTab === tab}
                            onClick={() => onTabChange(tab)}
                            onKeyDown={(e) => handleTabKeyDown(e, index)}
                        />
                    ))}
                    </div>
                </div>

                <div className="px-6 pb-6">
                    <div className="py-6 space-y-6">
                        {children}

                        <div className="flex justify-center gap-4 pt-6">
                            <Button
                                onClick={onCancel}
                                variant="outline"
                                className="w-32 h-12 text-base font-semibold rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onSave}
                                className="w-32 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold rounded-lg shadow-lg shadow-primary/30"
                                disabled={isSaveDisabled}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
