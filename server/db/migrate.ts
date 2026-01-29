import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: 'require'
});
const db = drizzle(client);

async function main() {
  try {
    console.log("Running database migrations...");

    // This will run migrations from the migrations folder
    await migrate(db, { migrationsFolder: "./server/db/migrations" });

    console.log("Migrations completed successfully!");

    await client.end();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
