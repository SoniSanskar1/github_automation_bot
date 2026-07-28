import { NextResponse } from "next/server";

import { internalWorkerEnvironmentSchema } from "@/lib/env.schema";
import { isAuthorizedWorker } from "@/modules/jobs/authorization";
import { processPendingJobs } from "@/modules/jobs/worker";

function logWorker(fields: Record<string, string | number>) {
  console.info(JSON.stringify({ source: "job_worker", ...fields }));
}

export async function POST(request: Request) {
  const environment = internalWorkerEnvironmentSchema.safeParse(process.env);
  if (!environment.success) {
    logWorker({ status: "configuration_error" });
    return NextResponse.json(
      { status: "worker_not_configured" },
      { status: 503 },
    );
  }

  if (
    !isAuthorizedWorker(
      request.headers.get("authorization"),
      environment.data.INTERNAL_WORKER_SECRET,
    )
  ) {
    logWorker({ status: "unauthorized" });
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await processPendingJobs();
    logWorker({ status: "completed", ...summary });
    return NextResponse.json({ status: "completed", ...summary });
  } catch {
    logWorker({ status: "worker_failed" });
    return NextResponse.json({ status: "worker_failed" }, { status: 500 });
  }
}
