import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAuthUser, authErrorResponse } from "@/lib/auth/serverAuth";

// ===================================
// Admin UIDs — only these users can access admin APIs
// ===================================

const ADMIN_UIDS = new Set(
  (process.env.ADMIN_UIDS || "").split(",").map((s) => s.trim()).filter(Boolean)
);

function isAdmin(uid: string): boolean {
  return ADMIN_UIDS.has(uid);
}

// ===================================
// GET — Token usage summary for all users
// ===================================

export async function GET(request: NextRequest) {
  try {
    const authed = await requireAuthUser(request);

    if (!isAdmin(authed.uid)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await getAdminDb();

    // Fetch aggregated token totals per user
    const totalsSnap = await db.collection("token_usage_totals").get();
    const userTotals = totalsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: doc.id,
        totalPromptTokens: data.totalPromptTokens || 0,
        totalCompletionTokens: data.totalCompletionTokens || 0,
        totalTokens: data.totalTokens || 0,
        totalRequests: data.totalRequests || 0,
        lastUsed: data.lastUsed?.toDate?.()?.toISOString?.() || null,
        byEndpoint: data.byEndpoint || {},
        byModel: data.byModel || {},
      };
    });

    // Compute grand totals
    const grandTotal = {
      totalTokens: userTotals.reduce((s, u) => s + u.totalTokens, 0),
      totalPromptTokens: userTotals.reduce((s, u) => s + u.totalPromptTokens, 0),
      totalCompletionTokens: userTotals.reduce((s, u) => s + u.totalCompletionTokens, 0),
      totalRequests: userTotals.reduce((s, u) => s + u.totalRequests, 0),
      totalUsers: userTotals.length,
    };

    // Optionally fetch user display names
    const userIds = userTotals.map((u) => u.userId);
    const userProfiles: Record<string, { displayName: string; email: string }> = {};

    if (userIds.length > 0) {
      // Batch fetch user profiles from users collection
      const batchSize = 10;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const profileSnap = await db
          .collection("users")
          .where("__name__", "in", batch)
          .get();
        profileSnap.docs.forEach((doc) => {
          const data = doc.data();
          userProfiles[doc.id] = {
            displayName: data.displayName || data.name || doc.id.slice(0, 8),
            email: data.email || "",
          };
        });
      }
    }

    // Enrich user totals with display info
    const enrichedTotals = userTotals.map((u) => ({
      ...u,
      displayName: userProfiles[u.userId]?.displayName || u.userId.slice(0, 8),
      email: userProfiles[u.userId]?.email || "",
    }));

    // Sort by total tokens descending
    enrichedTotals.sort((a, b) => b.totalTokens - a.totalTokens);

    // Optionally fetch recent usage records (last 50)
    const url = new URL(request.url);
    const includeRecent = url.searchParams.get("recent") === "true";

    let recentRecords: Array<Record<string, unknown>> = [];
    if (includeRecent) {
      const recentSnap = await db
        .collection("token_usage")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      recentRecords = recentSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          endpoint: data.endpoint,
          model: data.model,
          promptTokens: data.promptTokens,
          completionTokens: data.completionTokens,
          totalTokens: data.totalTokens,
          timestamp: data.timestamp?.toDate?.()?.toISOString?.() || null,
          displayName: userProfiles[data.userId]?.displayName || data.userId?.slice(0, 8),
        };
      });
    }

    return new Response(
      JSON.stringify({
        grandTotal,
        users: enrichedTotals,
        recent: recentRecords,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    console.error("Admin token usage API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch token usage" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
