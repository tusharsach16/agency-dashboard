import { useSearchParams } from "react-router-dom";
import { DashboardFilterParams, TaskStatus, TaskPriority } from "../types";

export function useDashboardFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (searchParams.get("status") as TaskStatus) || "";
  const priority = (searchParams.get("priority") as TaskPriority) || "";
  const projectId = searchParams.get("projectId") || "";
  const assignedToId = searchParams.get("assignedToId") || "";

  const filters: DashboardFilterParams = {
    status: status || undefined,
    priority: priority || undefined,
    projectId: projectId || undefined,
    assignedToId: assignedToId || undefined,
  };

  function setFilter(key: keyof DashboardFilterParams, value?: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value.trim() === "") {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value.trim());
    }
    setSearchParams(nextParams, { replace: false });
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams(), { replace: false });
  }

  const activeFilterCount = [status, priority, projectId, assignedToId].filter(Boolean).length;

  return {
    filters,
    rawFilters: { status, priority, projectId, assignedToId },
    setFilter,
    clearFilters,
    activeFilterCount,
  };
}
