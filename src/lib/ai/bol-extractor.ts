/**
 * BOL (Bill of Lading) data extraction using Claude Vision via OpenRouter.
 * Accepts a base64-encoded image and returns structured data.
 */

import { chatCompletion } from "./client";
import type { BolExtractedData } from "@/lib/types";

const EXTRACTION_PROMPT = `You are an expert at reading freight/trucking Bill of Lading (BOL) documents.
Extract ALL fields from this Bill of Lading photo. The document may contain both printed and handwritten text.

Return a JSON object with exactly these fields (use empty string "" if a field is not found or illegible):

{
  "shipFrom": {
    "name": "shipper company name",
    "address": "street address",
    "city": "city",
    "state": "state abbreviation",
    "zip": "zip code"
  },
  "shipTo": {
    "name": "consignee/receiver company name",
    "address": "street address",
    "city": "city",
    "state": "state abbreviation",
    "zip": "zip code"
  },
  "bolNumber": "BOL or load reference number from the carrier (e.g., THT 2021)",
  "brokerLoadNumber": "broker's load number (e.g., KFB #10011)",
  "commodity": "description of goods being shipped",
  "weight": "total weight with units",
  "quantity": "quantity with units (e.g., 1400 bags)",
  "carrierName": "carrier/trucking company name",
  "driverName": "driver's full name",
  "truckTag": "truck tag/license plate number",
  "truckNumber": "truck or trailer number",
  "pickupDate": "pickup date in YYYY-MM-DD format",
  "deliveryDate": "delivery date in YYYY-MM-DD format",
  "deliveryTime": "delivery time if shown",
  "receiverSignaturePresent": true or false (boolean),
  "receiverName": "printed name of person who signed for delivery",
  "notes": "any other notable information on the document"
}

IMPORTANT:
- Parse handwritten text carefully — especially dates, names, and numbers
- For handwritten numbers, be extra careful distinguishing: 0 vs 9, 1 vs 7, 2 vs Z
- For handwritten names, consider that "Rolfe" might look like "Rolpe" or "Lirope" — use context clues
- For dates, convert to YYYY-MM-DD format regardless of how they're written (e.g., "2/16/26" = "2026-02-16")
- If a field spans multiple lines on the document, combine them
- Look for reference numbers that start with prefixes like KFB#, THT, etc.
- The "Carrier" field may list multiple entities — include all of them
- The carrier name and the broker name may overlap (e.g., "Kingdom Family" is the broker, the carrier might be listed separately)
- Return ONLY the JSON object, no markdown formatting or explanation`;

export async function extractBolData(
  imageBase64: string,
  mediaType: string = "image/jpeg"
): Promise<BolExtractedData> {
  const dataUrl = `data:${mediaType};base64,${imageBase64}`;

  const responseText = await chatCompletion([
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: dataUrl },
        },
        {
          type: "text",
          text: EXTRACTION_PROMPT,
        },
      ],
    },
  ]);

  // Parse the JSON response, stripping any markdown fences if present
  let jsonText = responseText.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const extracted: BolExtractedData = JSON.parse(jsonText);
  return extracted;
}
