import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const globalForPrisma = globalThis;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// Initialize the raw pg connection pool with cloud-friendly SSL handling
const isLocal = /localhost|127\.0\.0\.1|::1/.test(connectionString);
// Remove sslmode from the URL so pg-connection-string doesn't override our SSL config
const dbUrl = new URL(connectionString);
dbUrl.searchParams.delete("sslmode");
const cleanConnectionString = dbUrl.toString();
const pool = new pg.Pool({
  connectionString: cleanConnectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// Pass the pool to the Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma with the adapter
export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
