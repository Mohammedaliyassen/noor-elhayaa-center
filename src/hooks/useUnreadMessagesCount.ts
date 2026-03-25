import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useUnreadMessagesCount = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread-messages-count", user?.id, role],
    queryFn: async () => {
      if (!user) return 0;

      if (role === "super_admin") {
        const { count, error } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("read", false);

        if (error) throw error;
        return count ?? 0;
      }

      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
    initialData: 0,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`unread-messages-count-${user.id}-${role ?? "guest"}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as { receiver_id: string; sender_id: string };
          const shouldRefresh = role === "super_admin"
            ? true
            : message.receiver_id === user.id || message.sender_id === user.id;

          if (shouldRefresh) {
            queryClient.invalidateQueries({ queryKey: ["unread-messages-count", user.id, role] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as { receiver_id: string; sender_id: string };
          const shouldRefresh = role === "super_admin"
            ? true
            : message.receiver_id === user.id || message.sender_id === user.id;

          if (shouldRefresh) {
            queryClient.invalidateQueries({ queryKey: ["unread-messages-count", user.id, role] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, role, user]);

  return query.data ?? 0;
};
