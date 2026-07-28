export type DashboardAction = {
  id: string;
  type: string;
  status: string;
  attemptCount: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  completedAt: Date | null;
};

export type DashboardEvent = {
  id: string;
  repository: string;
  githubEvent: string;
  githubAction: string | null;
  senderLogin: string | null;
  resourceNumber: number | null;
  receivedAt: Date;
  jobStatus: string;
  jobAttemptCount: number;
  jobErrorMessage: string | null;
  matchedRules: number;
  evaluatedRules: number;
  actions: DashboardAction[];
};

export type EventRow = {
  id: string;
  userId: string;
  repositoryUserId: string;
  repository: string;
  githubEvent: string;
  githubAction: string | null;
  senderLogin: string | null;
  resourceNumber: number | null;
  receivedAt: Date;
};

export type JobRow = {
  eventId: string;
  status: string;
  attemptCount: number;
  lastErrorMessage: string | null;
};

export type EvaluationRow = {
  eventId: string;
  matched: boolean;
};

export type ActionRow = DashboardAction & {
  eventId: string;
  userId: string;
};

export function assembleDashboardEvents(
  userId: string,
  eventRows: EventRow[],
  jobRows: JobRow[],
  evaluationRows: EvaluationRow[],
  actionRows: ActionRow[],
): DashboardEvent[] {
  const ownedEvents = eventRows.filter(
    (event) =>
      event.userId === userId && event.repositoryUserId === userId,
  );
  const ownedEventIds = new Set(ownedEvents.map((event) => event.id));

  return ownedEvents.map((event) => {
    const job = jobRows.find((candidate) => candidate.eventId === event.id);
    const evaluations = evaluationRows.filter(
      (evaluation) => evaluation.eventId === event.id,
    );
    const actions = actionRows
      .filter(
        (action) =>
          action.userId === userId &&
          ownedEventIds.has(action.eventId) &&
          action.eventId === event.id,
      )
      .map((action) => ({
        id: action.id,
        type: action.type,
        status: action.status,
        attemptCount: action.attemptCount,
        lastErrorCode: action.lastErrorCode,
        lastErrorMessage: action.lastErrorMessage,
        completedAt: action.completedAt,
      }));

    return {
      id: event.id,
      repository: event.repository,
      githubEvent: event.githubEvent,
      githubAction: event.githubAction,
      senderLogin: event.senderLogin,
      resourceNumber: event.resourceNumber,
      receivedAt: event.receivedAt,
      jobStatus: job?.status ?? "not_scheduled",
      jobAttemptCount: job?.attemptCount ?? 0,
      jobErrorMessage: job?.lastErrorMessage ?? null,
      matchedRules: evaluations.filter((evaluation) => evaluation.matched)
        .length,
      evaluatedRules: evaluations.length,
      actions,
    };
  });
}
