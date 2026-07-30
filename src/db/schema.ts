import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  githubLogin: text("github_login").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

export const githubInstallations = pgTable(
  "github_installations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    githubInstallationId: text("github_installation_id").notNull(),
    accountLogin: text("account_login").notNull(),
    accountType: text("account_type").notNull(),
    status: text("status").default("active").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("github_installations_external_id_unique").on(
      table.githubInstallationId,
    ),
    index("github_installations_user_id_idx").on(table.userId),
  ],
);

export const repositories = pgTable(
  "repositories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    installationId: uuid("installation_id")
      .notNull()
      .references(() => githubInstallations.id, { onDelete: "cascade" }),
    githubRepositoryId: text("github_repository_id").notNull(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    fullName: text("full_name").notNull(),
    defaultBranch: text("default_branch").notNull(),
    isPrivate: boolean("is_private").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("repositories_external_id_unique").on(table.githubRepositoryId),
    index("repositories_user_id_idx").on(table.userId),
    index("repositories_installation_id_idx").on(table.installationId),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    installationId: uuid("installation_id")
      .notNull()
      .references(() => githubInstallations.id, { onDelete: "cascade" }),
    githubDeliveryId: text("github_delivery_id").notNull(),
    githubEvent: text("github_event").notNull(),
    githubAction: text("github_action"),
    payload: jsonb("payload").$type<unknown>().notNull(),
    payloadSha256: text("payload_sha256").notNull(),
    senderLogin: text("sender_login"),
    resourceNumber: integer("resource_number"),
    ingestionStatus: text("ingestion_status").default("queued").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("webhook_events_delivery_id_unique").on(
      table.githubDeliveryId,
    ),
    index("webhook_events_user_received_idx").on(
      table.userId,
      table.receivedAt,
    ),
    index("webhook_events_repository_received_idx").on(
      table.repositoryId,
      table.receivedAt,
    ),
    index("webhook_events_type_action_idx").on(
      table.githubEvent,
      table.githubAction,
    ),
  ],
);

export const processingJobs = pgTable(
  "processing_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => webhookEvents.id, { onDelete: "cascade" }),
    status: text("status").default("pending").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lockedBy: text("locked_by"),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("processing_jobs_event_id_unique").on(table.eventId),
    index("processing_jobs_status_next_attempt_idx").on(
      table.status,
      table.nextAttemptAt,
    ),
    index("processing_jobs_locked_at_idx").on(table.lockedAt),
  ],
);

export const automationRules = pgTable(
  "automation_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    eventType: text("event_type").notNull(),
    eventAction: text("event_action").notNull(),
    conditions: jsonb("conditions").$type<unknown>().notNull(),
    actions: jsonb("actions").$type<unknown>().notNull(),
    version: integer("version").default(1).notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    index("automation_rules_owner_idx").on(table.userId),
    index("automation_rules_lookup_idx").on(
      table.repositoryId,
      table.eventType,
      table.eventAction,
      table.isEnabled,
    ),
  ],
);

export const ruleEvaluations = pgTable(
  "rule_evaluations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => webhookEvents.id, { onDelete: "cascade" }),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => automationRules.id, { onDelete: "cascade" }),
    ruleVersion: integer("rule_version").notNull(),
    matched: boolean("matched").notNull(),
    explanation: jsonb("explanation").$type<unknown>().notNull(),
    evaluatedAt: timestamp("evaluated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("rule_evaluations_event_rule_version_unique").on(
      table.eventId,
      table.ruleId,
      table.ruleVersion,
    ),
    index("rule_evaluations_event_idx").on(table.eventId),
  ],
);

export const actionExecutions = pgTable(
  "action_executions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => webhookEvents.id, { onDelete: "cascade" }),
    ruleId: uuid("rule_id")
      .notNull()
      .references(() => automationRules.id, { onDelete: "cascade" }),
    actionType: text("action_type").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    target: jsonb("target").$type<unknown>().notNull(),
    requestSummary: jsonb("request_summary").$type<unknown>().notNull(),
    status: text("status").default("pending").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    externalReference: text("external_reference"),
    lastHttpStatus: integer("last_http_status"),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("action_executions_idempotency_key_unique").on(
      table.idempotencyKey,
    ),
    index("action_executions_owner_idx").on(table.userId),
    index("action_executions_status_next_attempt_idx").on(
      table.status,
      table.nextAttemptAt,
    ),
    index("action_executions_event_created_idx").on(
      table.eventId,
      table.createdAt,
    ),
  ],
);

export const aiEnrichments = pgTable(
  "ai_enrichments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositories.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => webhookEvents.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    promptVersion: integer("prompt_version").notNull(),
    status: text("status").default("processing").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    summary: text("summary"),
    priority: text("priority"),
    suggestedLabel: text("suggested_label"),
    notificationStatus: text("notification_status")
      .default("not_requested")
      .notNull(),
    notificationAttemptCount: integer("notification_attempt_count")
      .default(0)
      .notNull(),
    notificationErrorCode: text("notification_error_code"),
    notificationErrorMessage: text("notification_error_message"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ai_enrichments_event_prompt_version_unique").on(
      table.eventId,
      table.promptVersion,
    ),
    index("ai_enrichments_owner_idx").on(table.userId),
    index("ai_enrichments_event_idx").on(table.eventId),
  ],
);
