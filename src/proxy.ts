import type { NextRequest } from "next/server";

import { refreshAuthSession } from "@/modules/auth/session-proxy";

export async function proxy(request: NextRequest) {
  return refreshAuthSession(request);
}

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*"],
};
