import "server-only";

import {
  serverEnvironmentSchema,
  type ServerEnvironment,
} from "./env.schema";

let validatedEnvironment: ServerEnvironment | undefined;

export function getServerEnvironment(): ServerEnvironment {
  validatedEnvironment ??= serverEnvironmentSchema.parse(process.env);
  return validatedEnvironment;
}
