import { type NextRequest, NextResponse } from "next/server";
import { extractBolData } from "@/lib/ai/bol-extractor";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type — include HEIC/HEIF for iPhone camera photos
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type (${file.type}). Please upload a JPEG, PNG, or WebP image.` },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB after client-side compression)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB. Try taking the photo from farther away or in lower resolution.` },
        { status: 400 }
      );
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Use JPEG media type for HEIC/HEIF (client converts via canvas)
    const mediaType = file.type === "image/heic" || file.type === "image/heif"
      ? "image/jpeg"
      : file.type;

    // Extract data using AI Vision
    const extractedData = await extractBolData(base64, mediaType);

    return NextResponse.json({ data: extractedData });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract BOL data";
    console.error("BOL extraction error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
