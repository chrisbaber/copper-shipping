import { type NextRequest, NextResponse } from "next/server";
import { extractBolData } from "@/lib/ai/bol-extractor";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Extract data using Claude Vision
    const extractedData = await extractBolData(
      base64,
      file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif"
    );

    return NextResponse.json({ data: extractedData });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract BOL data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
