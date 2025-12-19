import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

// Configure web-push
webpush.setVapidDetails(
  process.env.WEB_PUSH_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url } = await request.json();

    const supabase = await createClient();

    // Get user's push subscription
    const { data: user } = await supabase
      .from("users")
      .select("push_subscription")
      .eq("id", userId)
      .single();

    if (!user?.push_subscription) {
      return NextResponse.json(
        { error: "User has no push subscription" },
        { status: 400 }
      );
    }

    const subscription = JSON.parse(user.push_subscription);

    // Send notification
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
        url,
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
