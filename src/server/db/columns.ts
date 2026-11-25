import { text } from "drizzle-orm/pg-core";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  16,
);

const ENTITY_PREFIXES = {
  institution: "ins",
  program: "prg",
} as const;

type Entity = keyof typeof ENTITY_PREFIXES;

export function generateId(entity: Entity) {
  return `${ENTITY_PREFIXES[entity]}_${nanoid()}`;
}

/** A primary key with a prefixed nanoid, such as `ins_…` for an institution. */
export const pk = (entity: Entity) =>
  text()
    .primaryKey()
    .$defaultFn(() => generateId(entity));
