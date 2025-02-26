import cron from "node-cron";
import { volumeBot } from "./bot";
console.log("volume bot started");

cron.schedule("* * * * *", async () => {
  console.log(`Running volume bot at every minute ${new Date().toISOString()}`);
  await volumeBot();
});
