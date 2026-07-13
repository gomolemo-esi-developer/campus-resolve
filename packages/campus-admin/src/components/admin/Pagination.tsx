interface PaginationProps {
    currentPage: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

export function Pagination({ currentPage, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    
    // Calculate display range
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    // Handle empty state
    if (totalPages === 0) {
        return (
            <div className="flex items-center justify-between mt-6 px-6">
                <p className="text-sm text-muted-foreground">No items to display</p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between mt-6 px-6 transition-all duration-300">
            {/* Item count info */}
            <p className="text-sm text-muted-foreground animate-fade-in">
                Showing <span className="font-semibold text-foreground">{startItem}</span> to{' '}
                <span className="font-semibold text-foreground">{endItem}</span> of{' '}
                <span className="font-semibold text-foreground">{totalItems}</span> items
            </p>

            {/* Pagination controls */}
            <div className="flex items-center justify-center gap-3 animate-fade-in">
                <button
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                        currentPage === 1
                            ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                            : "bg-foreground text-background hover:bg-foreground/90 hover:scale-105"
                    }`}
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    aria-label="Previous page"
                    disabled={currentPage === 1}
                >
                    ←
                </button>
                <div className="bg-foreground rounded-full px-2 py-2 flex items-center gap-1" role="navigation" aria-label="Pagination">
                    {pages.map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            aria-current={page === currentPage ? "page" : undefined}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 text-sm font-medium ${
                                page === currentPage
                                    ? "bg-[hsl(14,100%,57%)] text-white shadow-sm scale-110"
                                    : "text-background hover:text-background/70 hover:scale-105"
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                        currentPage === totalPages
                            ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                            : "bg-foreground text-background hover:bg-foreground/90 hover:scale-105"
                    }`}
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    aria-label="Next page"
                    disabled={currentPage === totalPages}
                >
                    →
                </button>
            </div>

            {/* Spacer for layout balance */}
            <div className="w-40"></div>
        </div>
    );
}
