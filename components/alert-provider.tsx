"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster, toast } from "sonner";

type AlertType = "info" | "success" | "warning" | "error";

interface AlertState {
  isOpen: boolean;
  title: string;
  description: string;
  type: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface AlertContextType {
  alert: (options: Omit<AlertState, "isOpen" | "showCancel"> & { showCancel?: boolean }) => void;
  confirm: (options: Omit<AlertState, "isOpen" | "showCancel">) => Promise<boolean>;
  notify: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
}

const AlertContext = createContext<AlertContextType | null>(null);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: "",
    description: "",
    type: "info",
    showCancel: false,
  });

  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const alert = useCallback((options: Omit<AlertState, "isOpen" | "showCancel"> & { showCancel?: boolean }) => {
    setAlertState({
      ...options,
      isOpen: true,
      showCancel: options.showCancel ?? false,
      confirmText: options.confirmText || "OK",
    });
  }, []);

  const confirm = useCallback((options: Omit<AlertState, "isOpen" | "showCancel">): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
      setAlertState({
        ...options,
        isOpen: true,
        showCancel: true,
        confirmText: options.confirmText || "Confirmar",
        cancelText: options.cancelText || "Cancelar",
      });
    });
  }, []);

  const handleConfirm = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
    alertState.onConfirm?.();
  };

  const handleCancel = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
    alertState.onCancel?.();
  };

  const notify = {
    success: (message: string) => toast.success(message, {
      style: {
        background: "#FFFAFA",
        border: "1px solid #062D49",
        color: "#062D49",
      },
    }),
    error: (message: string) => toast.error(message, {
      style: {
        background: "#FFFAFA",
        border: "1px solid #DC2626",
        color: "#DC2626",
      },
    }),
    info: (message: string) => toast.info(message, {
      style: {
        background: "#FFFAFA",
        border: "1px solid #062D49",
        color: "#062D49",
      },
    }),
    warning: (message: string) => toast.warning(message, {
      style: {
        background: "#FFFAFA",
        border: "1px solid #F59E0B",
        color: "#92400E",
      },
    }),
  };

  const getHeaderColor = () => {
    switch (alertState.type) {
      case "error":
        return "text-red-600";
      case "warning":
        return "text-amber-600";
      case "success":
        return "text-green-600";
      default:
        return "text-navy";
    }
  };

  return (
    <AlertContext.Provider value={{ alert, confirm, notify }}>
      {children}
      <Toaster position="top-right" richColors />
      <AlertDialog open={alertState.isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent className="bg-neve border-navy/20">
          <AlertDialogHeader>
            <AlertDialogTitle className={getHeaderColor()}>
              {alertState.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              {alertState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertState.showCancel && (
              <AlertDialogCancel 
                onClick={handleCancel}
                className="border-navy/20 text-navy hover:bg-beje"
              >
                {alertState.cancelText}
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                alertState.type === "error"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-navy hover:bg-navy/90 text-neve"
              }
            >
              {alertState.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}
