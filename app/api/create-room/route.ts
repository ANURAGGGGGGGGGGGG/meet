import { NextResponse } from "next/server";

export async function POST() {
  const roomId = crypto.randomUUID().slice(0, 8);
  return NextResponse.json({ roomId });
}
