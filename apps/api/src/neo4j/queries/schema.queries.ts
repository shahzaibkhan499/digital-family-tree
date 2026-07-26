export const SCHEMA_QUERIES = {
  CREATE_PERSON_ID_CONSTRAINT: `
    CREATE CONSTRAINT person_id_unique IF NOT EXISTS
    FOR (p:Person) REQUIRE p.id IS UNIQUE
  `,
  CREATE_FAMILY_ID_CONSTRAINT: `
    CREATE CONSTRAINT family_id_unique IF NOT EXISTS
    FOR (f:Family) REQUIRE f.id IS UNIQUE
  `,
  CREATE_CLAN_ID_CONSTRAINT: `
    CREATE CONSTRAINT clan_id_unique IF NOT EXISTS
    FOR (c:Clan) REQUIRE c.id IS UNIQUE
  `,
  CREATE_COMMUNITY_ID_CONSTRAINT: `
    CREATE CONSTRAINT community_id_unique IF NOT EXISTS
    FOR (c:Community) REQUIRE c.id IS UNIQUE
  `,
  CREATE_MARRIAGE_ID_CONSTRAINT: `
    CREATE CONSTRAINT marriage_id_unique IF NOT EXISTS
    FOR (m:Marriage) REQUIRE m.id IS UNIQUE
  `,

  CREATE_PERSON_DISPLAY_ID_INDEX: `
    CREATE INDEX person_display_id IF NOT EXISTS
    FOR (p:Person) ON (p.displayId)
  `,
  CREATE_FAMILY_DISPLAY_ID_INDEX: `
    CREATE INDEX family_display_id IF NOT EXISTS
    FOR (f:Family) ON (f.displayId)
  `,
  CREATE_CLAN_DISPLAY_ID_INDEX: `
    CREATE INDEX clan_display_id IF NOT EXISTS
    FOR (c:Clan) ON (c.displayId)
  `,
  CREATE_COMMUNITY_DISPLAY_ID_INDEX: `
    CREATE INDEX community_display_id IF NOT EXISTS
    FOR (c:Community) ON (c.displayId)
  `,
  CREATE_PERSON_NAME_INDEX: `
    CREATE INDEX person_name IF NOT EXISTS
    FOR (p:Person) ON (p.firstName, p.lastName)
  `,
} as const;

export function getSchemaQueries(): string[] {
  return Object.values(SCHEMA_QUERIES);
}
