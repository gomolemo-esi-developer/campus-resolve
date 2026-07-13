import { useState, useMemo } from "react";

export function usePagination<T>(data: T[], itemsPerPage: number = 10) {
    const [currentPage, setCurrentPage] = useState(1);

    const paginatedData = useMemo(() => {
        return data.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [data, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(data.length / itemsPerPage);

    return {
        currentPage,
        setCurrentPage,
        paginatedData,
        totalPages,
    };
}
