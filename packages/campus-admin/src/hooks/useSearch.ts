import { useState, useMemo } from "react";

/**
 * Custom hook for filtering data based on search query
 * @param data - Array of items to search through
 * @param searchFields - Array of field keys to search in
 * @returns Object with searchQuery, setSearchQuery, and filteredData
 */
export function useSearch<T extends Record<string, any>>(
    data: T[],
    searchFields: (keyof T)[]
) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return data;

        const query = searchQuery.toLowerCase();
        return data.filter((item) =>
            searchFields.some((field) =>
                String(item[field]).toLowerCase().includes(query)
            )
        );
    }, [data, searchQuery, searchFields]);

    return { searchQuery, setSearchQuery, filteredData };
}
