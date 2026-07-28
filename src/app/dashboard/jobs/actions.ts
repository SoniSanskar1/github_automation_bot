"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requestJobRetry } from "@/modules/jobs/recovery";

export async function retryJobAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth_error=authentication_required");
  }

  const input = z
    .object({ jobId: z.string().uuid() })
    .safeParse({ jobId: formData.get("jobId") });

  const result = input.success
    ? await requestJobRetry(user.id, input.data.jobId)
    : "not_available";

  revalidatePath("/dashboard");
  redirect(`/dashboard?job_result=${result}#history`);
}
