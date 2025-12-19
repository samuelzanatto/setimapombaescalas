"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePushNotifications(userId: string | null) {
  const isSupported = useMemo(() => {
    if (typeof window !== "undefined") {
      return "serviceWorker" in navigator && "PushManager" in window;
    }
    return false;
  }, []);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!isSupported) return;
    
    let isMounted = true;
    
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (isMounted) {
          setIsSubscribed(!!subscription);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };
    
    checkSubscription();
    
    return () => {
      isMounted = false;
    };
  }, [isSupported]);

  const subscribe = async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // Save subscription to database
      await supabase
        .from("users")
        .update({ push_subscription: JSON.stringify(subscription) })
        .eq("id", userId);

      setIsSubscribed(true);
    } catch (error) {
      console.error("Error subscribing to push:", error);
    }

    setIsLoading(false);
  };

  const unsubscribe = async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove subscription from database
      await supabase
        .from("users")
        .update({ push_subscription: null })
        .eq("id", userId);

      setIsSubscribed(false);
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
    }

    setIsLoading(false);
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
