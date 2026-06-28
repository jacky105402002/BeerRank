import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient, QueryResultRow } from "pg";

type DatabaseHealth = {
  configured: boolean;
  connected: boolean;
  database?: string;
  error?: string;
};

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool?: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (connectionString) {
      this.pool = new Pool({
        connectionString,
        max: 3,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000
      });
    }
  }

  async health(): Promise<DatabaseHealth> {
    if (!this.pool) {
      return {
        configured: false,
        connected: false,
        error: "DATABASE_URL is not configured"
      };
    }

    try {
      const result = await this.pool.query<{ database: string }>("select current_database() as database");
      return {
        configured: true,
        connected: true,
        database: result.rows[0]?.database
      };
    } catch (error) {
      return {
        configured: true,
        connected: false,
        error: error instanceof Error ? error.message : "Unknown database error"
      };
    }
  }

  isConfigured() {
    return Boolean(this.pool);
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) {
    if (!this.pool) {
      throw new Error("DATABASE_URL is not configured");
    }

    return this.pool.query<T>(text, params);
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>) {
    if (!this.pool) {
      throw new Error("DATABASE_URL is not configured");
    }

    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await callback(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
