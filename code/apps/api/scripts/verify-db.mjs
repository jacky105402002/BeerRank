import pg from "pg";

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required to verify the database.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

const tables = [
  "profiles",
  "breweries",
  "beers",
  "reviews",
  "review_photos",
  "comments",
  "post_reactions",
  "beer_match_suggestions",
  "schema_migrations"
];

async function run() {
  const client = await pool.connect();
  try {
    const database = await client.query("select current_database() as database");
    console.log(`database=${database.rows[0].database}`);

    for (const table of tables) {
      const result = await client.query(`select count(*)::int as count from ${table}`);
      console.log(`${table}=${result.rows[0].count}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
