import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { authToken } = await req.json();

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all bulletins marked as processed
    // Note: This logic assumes we can query by 'status_procesamiento'
    // Depending on Payload config, this might need depth=0 for speed
    const bulletinsRes = await fetch(
      `${API_URL}/boletines?where[status_procesamiento][equals]=ai_enhanced&limit=1000&depth=0`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!bulletinsRes.ok) {
      throw new Error("Failed to fetch bulletins");
    }

    const bulletinsData = await bulletinsRes.json();
    const processedBulletins = bulletinsData.docs || [];

    // 2. Fetch all learning records
    // This could be heavy if there are thousands. For now assuming < 5000 is okay.
    // Ideally we would filter learnings by the bulletin IDs we found, but Payload query url size limits might prevent that.
    // Instead, we just fetch mostly recent learnings or all if possible.
    // Optimization: We can check existence one by one or in batches if the list is huge.
    // Let's try to fetch all learnings (limit 5000).
    const learningsRes = await fetch(
      `${API_URL}/learning-records?limit=5000&depth=0`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!learningsRes.ok) {
      throw new Error("Failed to fetch learning records");
    }

    const learningsData = await learningsRes.json();
    const learnings = learningsData.docs || [];

    // Create a Set of processed item IDs that exist in learnings
    // Learning records have a 'processed_items' array which contains IDs/Relation
    // Since depth=0, processed_items might be just IDs.
    const learnedIds = new Set();
    learnings.forEach((lr: any) => {
      if (Array.isArray(lr.processed_items)) {
        lr.processed_items.forEach((item: any) => {
          // Item could be ID string or object depending on payload version/depth
          const id = typeof item === "string" ? item : item.id;
          if (id) learnedIds.add(id);
        });
      }
    });

    const toReset = [];

    // 3. Find bulletins that claim to be processed but are not in learnings
    for (const b of processedBulletins) {
      if (!learnedIds.has(b.id)) {
        toReset.push(b.id);
      }
    }

    console.log(
      `Sync Status: Found ${processedBulletins.length} marked bulletins. Found ${learnings.length} learning records. Resetting ${toReset.length} bulletins.`,
    );

    // 4. Update them to null/pending
    // Sequential update for safety, or Promise.all for speed (limit concurrency)
    // Payload doesn't have a bulk update by ID list easily exposed in REST unless custom.
    let updatedCount = 0;
    const errors = [];

    // Process in batches of 5 to avoid overwhelming server
    const batchSize = 5;
    for (let i = 0; i < toReset.length; i += batchSize) {
      const batch = toReset.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (id) => {
          try {
            const patchRes = await fetch(`${API_URL}/boletines/${id}`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status_procesamiento: null }), // Reset to null/empty
            });
            if (patchRes.ok) updatedCount++;
            else errors.push(id);
          } catch (e) {
            errors.push(id);
          }
        }),
      );
    }

    return NextResponse.json({
      success: true,
      message: `Sync complete. Reset ${updatedCount} bulletins.`,
      details: {
        found_marked: processedBulletins.length,
        found_learnings: learnings.length,
        to_reset: toReset.length,
        updated: updatedCount,
        errors: errors.length,
      },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 },
    );
  }
}
