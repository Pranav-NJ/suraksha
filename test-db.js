import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

console.log("Testing database connection...");
console.log("DATABASE_URL:", process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@'));

try {
  const client = postgres(process.env.DATABASE_URL);
  
  // Simple connection test
  const result = await client`SELECT 1 as test`;
  console.log("✅ Database connection successful!");
  console.log("Result:", result);
  
  await client.end();
} catch (error) {
  console.error("❌ Database connection failed:", error.message);
  
  if (error.code === 'ECONNRESET') {
    console.log("\n🔧 Possible solutions:");
    console.log("1. Check if database is ready in Render dashboard");
    console.log("2. Verify the connection string is correct");
    console.log("3. Try again in a few minutes");
    console.log("4. Skip migration and deploy directly");
  }
}
