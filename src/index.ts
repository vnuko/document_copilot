import { createApp } from './app.js';
import { config } from './config/index.js';

async function main() {
  const app = await createApp();

  app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
  });
}

main().catch(console.error);
