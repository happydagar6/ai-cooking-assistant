"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"


export default function QueryProvider({ children }) {
    // Create QueryClient with optimization settings
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Data stays fresh for 5 minutes (no refetch needed)
                staleTime: 5 * 60 * 1000,

                // Keep data in memory for 10 minutes after component unmounts
                gcTime: 10 * 60 * 1000,

                // Don't refetch when user browser tabs
                refetchOnWindowFocus: false,

                // Don't refetch on network reconnect
                refetchOnReconnect: false,

                // Only retry failed requests once
                retry: 1,

                // Use cached data when available, only refetch if stale
                refetchOnMount: false,

                // Don't automatically refetch in background
                refetchInterval: false,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* Development tools to see cache status */}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </QueryClientProvider>
    )
}