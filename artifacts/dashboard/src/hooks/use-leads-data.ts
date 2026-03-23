import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetLeads, 
  useDeleteLead, 
  getGetLeadsQueryKey 
} from "@workspace/api-client-react";

// Wrap the generated hooks to add cache invalidation and UI state management
export function useLeadsData() {
  return useGetLeads({
    query: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
    }
  });
}

export function useRemoveLead() {
  const queryClient = useQueryClient();
  
  return useDeleteLead({
    mutation: {
      onMutate: async ({ id }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: getGetLeadsQueryKey() });

        // Snapshot the previous value
        const previousLeads = queryClient.getQueryData(getGetLeadsQueryKey());

        // Optimistically update to the new value
        queryClient.setQueryData(getGetLeadsQueryKey(), (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter(lead => lead.id !== id);
        });

        return { previousLeads };
      },
      onError: (err, newLead, context) => {
        // Rollback on error
        if (context?.previousLeads) {
          queryClient.setQueryData(getGetLeadsQueryKey(), context.previousLeads);
        }
      },
      onSettled: () => {
        // Always refetch after error or success to ensure sync
        queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
      },
    }
  });
}
