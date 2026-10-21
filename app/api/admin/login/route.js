import { login, sameOrigin } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

// Masuk operator dari form /admin (src/admin/AdminLogin.jsx).
export async function POST(request) {
  if (!sameOrigin(request)) return Response.json({ error: "Asal permintaan tidak valid." }, { status: 403 });
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: "Data login tidak valid." }, { status: 400 });
  }
  if (typeof data?.email !== "string" || typeof data?.password !== "string" || data.email.length > 250 || data.password.length > 500) {
    return Response.json({ error: "Data login tidak valid." }, { status: 400 });
  }
  const result = await login(request, data);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status, headers: result.status === 429 ? { "Retry-After": "900" } : {} });
  }
  return Response.json({ ok: true });
}
