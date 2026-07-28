import { createHealthResponse } from "@/modules/system/health";

export function GET() {
  return Response.json(createHealthResponse());
}
