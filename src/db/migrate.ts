import { readFileSync } from "node:fs";
import { join } from "node:path";
import dns from "node:dns/promises";
import https from "node:https";
import dotenv from "dotenv";
import { neon, neonConfig } from "@neondatabase/serverless";

dotenv.config();

// Node.js undici (built-in fetch) fails with ETIMEDOUT on this machine even
// though port 443 is reachable. The root cause is that dns.lookup() may pick
// an IPv4 address that doesn't answer, while curl succeeds because it falls
// back to another. We override neon's fetch with a thin https.request wrapper
// that uses dns.resolve4() to get all IPv4 addresses and tries each one until
// a connection succeeds.
async function customFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const parsed = new URL(url);
  const ipv4List = await dns.resolve4(parsed.hostname);

  for (const ip of ipv4List) {
    try {
      const result = await new Promise<Response>((resolve, reject) => {
        const body = opts.body as string | Buffer | undefined;
        const headers = (opts.headers ?? {}) as Record<string, string>;
        const req = https.request(
          {
            hostname: ip,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: (opts.method ?? "GET").toUpperCase(),
            headers: { ...headers, host: parsed.hostname },
            servername: parsed.hostname,
            rejectUnauthorized: true,
            timeout: 10_000,
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (c: Buffer) => chunks.push(c));
            res.on("end", () =>
              resolve(
                new Response(Buffer.concat(chunks), {
                  status: res.statusCode ?? 200,
                  headers: res.headers as Record<string, string>,
                })
              )
            );
          }
        );
        req.on("timeout", () => { req.destroy(new Error("timeout")); });
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
      });
      return result;
    } catch {
      // try next IP
    }
  }
  throw new Error(`All IPv4 addresses for ${parsed.hostname} failed`);
}

neonConfig.fetchFunction = customFetch;

const MIGRATIONS_TABLE = "__drizzle_migrations";
const MIGRATIONS_FOLDER = join(process.cwd(), "src/db/migrations");

interface JournalEntry {
  idx: number;
  tag: string;
}

interface Journal {
  entries: JournalEntry[];
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(url);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      tag TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const journal: Journal = JSON.parse(
    readFileSync(join(MIGRATIONS_FOLDER, "meta/_journal.json"), "utf8")
  );

  const applied = await sql.query<{ tag: string }>(
    `SELECT tag FROM ${MIGRATIONS_TABLE}`
  );
  const appliedTags = new Set(applied.map((r) => r.tag));

  const pending = journal.entries.filter((e) => !appliedTags.has(e.tag));

  if (pending.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const entry of pending) {
    const sqlFile = join(MIGRATIONS_FOLDER, `${entry.tag}.sql`);
    const statements = readFileSync(sqlFile, "utf8")
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`Applying migration: ${entry.tag}`);

    for (const statement of statements) {
      await sql.query(statement);
    }

    await sql.query(`INSERT INTO ${MIGRATIONS_TABLE} (tag) VALUES ($1)`, [entry.tag]);
  }

  console.log(`Applied ${pending.length} migration(s) successfully.`);
}

main().catch((error) => {
  console.error("Migration failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
