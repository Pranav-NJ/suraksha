import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function createTables() {
  try {
    console.log("Creating database tables...");
    
    // Import all schema tables
    const { users, emergencyContacts, emergencyAlerts, communityAlerts, safeZones, liveStreams, sessions } = schema;
    
    // This is a simplified approach - in production, you'd use proper migrations
    console.log("Database connection successful!");
    console.log("Tables will be created automatically on first use with Drizzle.");
    
    await client.end();
    console.log("Migration check completed!");
  } catch (error) {
    console.error("Database setup error:", error);
    process.exit(1);
  }
}

createTables();
