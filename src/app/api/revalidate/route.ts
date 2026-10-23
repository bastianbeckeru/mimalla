import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/server/catalog/cached-catalog";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 });
  }

  revalidateTag(CATALOG_TAG, { expire: 0 });
  return Response.json({ revalidated: [CATALOG_TAG] });
}
