import { useAppStore, ToastItem } from "../store/appStore.ts";

export function useNotification() {
  const notifications = useAppStore((state) => state.notifications);
  const addNotification = useAppStore((state) => state.addNotification);
  const removeNotification = useAppStore((state) => state.removeNotification);

  const success = (message: string) => addNotification("success", message);
  const error = (message: string) => addNotification("error", message);
  const info = (message: string) => addNotification("info", message);
  const warning = (message: string) => addNotification("warning", message);

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
  };
}

export type { ToastItem };
export default useNotification;
