export type TransactionalInsert = {
  insertEvent: () => Promise<string | undefined>;
  insertJob: (eventId: string) => Promise<void>;
};

export async function insertEventAndJob(operations: TransactionalInsert) {
  const eventId = await operations.insertEvent();

  if (!eventId) {
    return { status: "duplicate" } as const;
  }

  // The caller runs both operations inside one database transaction. Throwing
  // here forces PostgreSQL to roll back the event if job creation fails.
  await operations.insertJob(eventId);
  return { status: "queued", eventId } as const;
}
