import { db } from "@cryptovision/shared/db/client";
import { users } from "@cryptovision/shared/db/schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authId, email, name } = body;

    if (!authId || !email) {
      return NextResponse.json(
        { error: "authId and email are required" },
        { status: 400 }
      );
    }

    // Upsert: create user if not exists, update if exists
    const result = await db
      .insert(users)
      .values({
        authId,
        email,
        name: name || null,
      })
      .onConflictDoUpdate({
        target: users.authId,
        set: {
          email,
          name: name || undefined,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ user: result[0] }, { status: 200 });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
