require("dotenv").config();

const { createApp } = require("./src/app");
const { env } = require("./src/config/env");

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`FarmTrak backend listening on http://0.0.0.0:${env.PORT}`);
});

