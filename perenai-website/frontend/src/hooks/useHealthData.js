import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { healthApi } from "../services/health";

export function useHealthData() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ latest: null, averages: {}, records_count: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary({ latest: null, averages: {}, records_count: 0 });
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [summaryData, historyData] = await Promise.all([
        healthApi.summary(),
        healthApi.history(90),
      ]);
      setSummary(summaryData);
      setHistory([...historyData].reverse());
    } catch {
      setSummary({ latest: null, averages: {}, records_count: 0 });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, history, loading, refresh };
}
