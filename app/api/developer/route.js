import { lockCount } from "@/lib/developer";
import { developerView } from "@/server/developer";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

// Status mode developer untuk bilah operator di situs publik (src/components/DeveloperBar.jsx). Hanya
// operator yang masuk mendapat isinya; peramban lain hanya mendapat { show: false }.
export async function GET() {
  const { developer, operator, preview } = await developerView();
  if (!operator) return Response.json({ show: false }, { headers: noStore });
  return Response.json({ show: true, preview, site: developer.site, count: lockCount(developer) }, { headers: noStore });
}
