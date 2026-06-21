import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export const PREMIUM_SUBSCRIPTION_PATH = "/pricing";

export function usePremiumAccess() {
  const { user } = useAuth();
  return Boolean(user?.is_premium);
}

export function useOpenPremiumSubscription() {
  const navigate = useNavigate();
  return useCallback(() => {
    navigate(PREMIUM_SUBSCRIPTION_PATH);
  }, [navigate]);
}
