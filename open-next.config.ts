import { defineConfig } from "@opennext/manifest";
import cloudflare from "@opennextjs/cloudflare";

export default defineConfig({
  adapter: cloudflare(),
});
