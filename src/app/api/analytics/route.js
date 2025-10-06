import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient, supabaseAdmin } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = supabaseAdmin || createClerkSupabaseClient(getToken);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";

    let data;
    switch (type) {
      case "overview":
        data = await getUserAnalytics(supabase, userId);
        break;
      case "cooking-time":
        data = await getCookingTimeStats(supabase, userId);
        break;
      case "features":
        data = await getMostUsedFeatures(supabase, userId);
        break;
      case "sessions":
        const limit = parseInt(searchParams.get("limit")) || 10;
        data = await getCookingSessionHistory(supabase, userId, limit);
        break;
      case "favorites":
        data = await getFavoriteRecipes(supabase, userId);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

// Helper functions
async function getUserAnalytics(supabase, userId) {
  try {
    // Get real-time data from actual tables instead of cached analytics

    // Count current recipes (not deleted ones)
    const { data: recipesData, error: recipesError } = await supabase
      .from("recipes")
      .select("id", { count: "exact" })
      .eq("created_by", userId);

    if (recipesError) throw recipesError;

    // Count total cooking sessions
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("cooking_sessions")
      .select("id", { count: "exact" })
      .eq("user_id", userId);

    if (sessionsError) throw sessionsError;

    // Count current favorites (not deleted recipes)
    const { data: favoritesData, error: favoritesError } = await supabase
      .from("user_recipes")
      .select(
        `
        id,
        recipes!inner(id)
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .eq("is_favorite", true);

    if (favoritesError) throw favoritesError;

    // Calculate cooking streak (last 7 days of sessions)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSessions, error: streakError } = await supabase
      .from("cooking_sessions")
      .select("started_at")
      .eq("user_id", userId)
      .gte("started_at", sevenDaysAgo.toISOString())
      .order("started_at", { ascending: false });

    if (streakError) throw streakError;

    // ✨ FIXED: Calculate total cooking time from actual completed sessions
    let totalCookingTime = 0;
    try {
      const { data: completedSessions, error: timeError } = await supabase
        .from("cooking_sessions")
        .select("estimated_time, actual_time, started_at, completed_at")
        .eq("user_id", userId)
        .not("completed_at", "is", null);

      if (timeError) {
        console.error(
          "Error fetching cooking sessions for time calculation:",
          timeError
        );
      } else {
        // Calculate total cooking time in minutes
        totalCookingTime =
          completedSessions?.reduce((total, session) => {
            // Use actual_time if available, otherwise calculate from timestamps, fallback to estimated_time
            let sessionTime = 0;

            if (session.actual_time && session.actual_time > 0) {
              sessionTime = session.actual_time;
            } else if (session.started_at && session.completed_at) {
              // Calculate duration from timestamps (in minutes)
              const startTime = new Date(session.started_at);
              const endTime = new Date(session.completed_at);
              sessionTime = Math.round((endTime - startTime) / (1000 * 60)); // Convert to minutes
            } else if (session.estimated_time) {
              sessionTime = session.estimated_time;
            }

            return total + (sessionTime || 0);
          }, 0) || 0;
      }
    } catch (timeCalcError) {
      console.error("Error calculating total cooking time:", timeCalcError);
      totalCookingTime = 0;
    }

    // Calculate unique days with cooking sessions
    const uniqueDays = new Set();
    recentSessions?.forEach((session) => {
      const date = new Date(session.started_at).toDateString();
      uniqueDays.add(date);
    });

    return {
      user_id: userId,
      total_recipes_created: recipesData?.length || 0,
      total_cooking_sessions: sessionsData?.length || 0,
      total_favorites: favoritesData?.length || 0,
      total_cooking_time: totalCookingTime, // ✨ FIXED: Added total cooking time
      cooking_streak: uniqueDays.size,
      last_cooking_date: recentSessions?.[0]?.started_at || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting real-time user analytics:", error);
    return getDefaultAnalytics();
  }
}

async function getCookingTimeStats(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from("cooking_sessions")
      .select("estimated_time, actual_time, completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .not("actual_time", "is", null)
      .order("started_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const stats = {
      total_sessions: data.length,
      average_estimated: 0,
      average_actual: 0,
      accuracy_percentage: 0,
      time_saved: 0,
      sessions_on_time: 0,
    };

    if (data.length > 0) {
      const totalEstimated = data.reduce(
        (sum, session) => sum + (session.estimated_time || 0),
        0
      );
      const totalActual = data.reduce(
        (sum, session) => sum + (session.actual_time || 0),
        0
      );

      stats.average_estimated = Math.round(totalEstimated / data.length);
      stats.average_actual = Math.round(totalActual / data.length);
      stats.time_saved = totalEstimated - totalActual;
      stats.sessions_on_time = data.filter(
        (s) => (s.actual_time || 0) <= (s.estimated_time || 0)
      ).length;
      stats.accuracy_percentage = Math.round(
        (stats.sessions_on_time / data.length) * 100
      );
    }

    return stats;
  } catch (error) {
    console.error("Error getting cooking time stats:", error);
    return getDefaultTimeStats();
  }
}

async function getMostUsedFeatures(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from("cooking_sessions")
      .select("features_used")
      .eq("user_id", userId)
      .not("features_used", "is", null);

    if (error) throw error;

    const featureStats = {};

    data.forEach((session) => {
      const features = session.features_used || {};
      Object.entries(features).forEach(([feature, data]) => {
        if (!featureStats[feature]) {
          featureStats[feature] = {
            name: formatFeatureName(feature),
            total_uses: 0,
            sessions_used: 0,
            value: 0, // ✨ FIXED: Added value field for chart compatibility
          };
        }
        featureStats[feature].total_uses += data.count || 0;
        featureStats[feature].sessions_used += 1;
        featureStats[feature].value = featureStats[feature].total_uses; // ✨ FIXED: Set value for charts
      });
    });

    const featuresArray = Object.values(featureStats)
      .sort((a, b) => b.total_uses - a.total_uses)
      .slice(0, 10);

    // ✨ FIXED: Return data in expected format
    return { features: featuresArray };
  } catch (error) {
    console.error("Error getting most used features:", error);
    return { features: [] }; // ✨ FIXED: Return empty array in proper format
  }
}

async function getCookingSessionHistory(supabase, userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from("cooking_sessions")
      .select(
        `
        *,
        recipes:recipe_id (
          id,
          title,
          difficulty,
          cuisine_type
        )
      `
      )
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting cooking session history:", error);
    return [];
  }
}

async function getFavoriteRecipes(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from("user_recipes")
      .select(
        `
        *,
        recipes!inner (
          id,
          title,
          description,
          difficulty,
          cuisine_type,
          prep_time,
          cook_time,
          servings,
          image_url,
          created_by
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_favorite", true)
      .order("saved_at", { ascending: false });

    if (error) throw error;
    return (
      data?.map((item) => ({
        ...item.recipes,
        user_recipe_id: item.id,
        saved_at: item.saved_at,
        personal_notes: item.personal_notes,
        rating: item.rating,
      })) || []
    );
  } catch (error) {
    console.error("Error getting favorite recipes:", error);
    return [];
  }
}

function getDefaultAnalytics() {
  return {
    total_recipes_created: 0,
    total_cooking_sessions: 0,
    total_cooking_time: 0,
    favorite_recipes_count: 0,
    most_used_features: {},
    cooking_streak: 0,
    last_cooking_date: null,
  };
}

function getDefaultTimeStats() {
  return {
    total_sessions: 0,
    average_estimated: 0,
    average_actual: 0,
    accuracy_percentage: 0,
    time_saved: 0,
    sessions_on_time: 0,
  };
}

function formatFeatureName(feature) {
  return feature
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
