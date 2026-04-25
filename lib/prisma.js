import { PrismaClient } from "@prisma/client";
import { PgAdapter } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

let prisma;

if (process.env.NODE_ENV === "production") {
  const adapter = new PgAdapter({
    connectionString: process.env.DATABASE_URL,
  });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = globalForPrisma.__prisma ?? new PrismaClient();
  if (!globalForPrisma.__prisma) globalForPrisma.__prisma = prisma;
}

export default prisma;
