import { logout, sameOrigin } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!sameOrigin(request)) return Response.json({ error: "Asal permintaan tidak valid." }, { status: 403 });
  await logout();
  return Response.json({ ok: true });
}
