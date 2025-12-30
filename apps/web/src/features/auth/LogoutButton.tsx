import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { logout, type SessionResponse } from "./api";
import { sessionQueryKey } from "./useSession";

export function LogoutButton() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData<SessionResponse>(sessionQueryKey, { user: null });
      navigate("/login", { replace: true });
    },
  });

  return (
    <button
      className="logout-button"
      type="button"
      disabled={logoutMutation.isPending}
      onClick={() => logoutMutation.mutate()}
    >
      {logoutMutation.isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}

