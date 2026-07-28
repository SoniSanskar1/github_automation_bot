import {
  boolean,
  index,
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
