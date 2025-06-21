import {createClient} from "@libsql/client";
import {drizzle} from "drizzle-orm/libsql";
import * as schema from "../src/lib/server/db/schema";
import chalk from "chalk";
import {eq} from "drizzle-orm";
import { generateId } from 'better-auth';

const REQUESTS_TO_CREATE = 10;

export default async function main(num_to_create: number = REQUESTS_TO_CREATE) {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const client = createClient({url: process.env.DATABASE_URL});
  const db = drizzle(client, {schema});

  const existingCount = await db.$count(schema.requests);

  console.log(chalk.yellow('🧹 Cleaning existing requests...'));
  if (existingCount > 0) await db.delete(schema.requests);

  const baseDate = new Date(Date.now() - 10000000000);
  const defaultExpiration = 60 * 60 * 48 * 1000; // 2 Days
  const expiresAt = new Date(Date.now() + defaultExpiration);

  const organizations = await db.select().from(schema.organizations).where(eq(schema.organizations.slug, 'phoenix-spark'));

  if (organizations.length !== 1) throw new Error('Organization Phoenix Spark not found');

  const users = [];

  console.log(`🏢 Creating ${num_to_create} users...`);
  for(let i = 0; i < num_to_create; i++) {
    const [{id}] = await db.insert(schema.users).values({
      id: generateId(),
      name: `Test Request User ${i + 1}`,
      email: `test.request.user${i + 1}@example.com`,
      emailVerified: true,
      role: 'user',
      banned: false,
      createdAt: baseDate,
      updatedAt: baseDate,
    }).returning({id:schema.users.id});

    users.push(id);
  }

  console.log(`🏢 Creating ${num_to_create} requests to join...`);
  for (let i = 0; i < num_to_create; i++) {
    await db.insert(schema.requests).values({
      id: generateId(),
      organizationId: organizations[0].id,
      expiresAt,
      role: Math.random() > 0.5 ? 'admin' : 'member',
      userId: users[i],
    })
  }
}

main().catch(console.error);