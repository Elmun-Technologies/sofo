/** `pnpm db:seed` — sample data into the local D1 database (.wrangler/state). */
import { withNodeDb } from "../lib/db-node";
import { getDb } from "../lib/db";
import { seedSample } from "./sample-data";

withNodeDb(async () => console.log(await seedSample(getDb()))).catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
