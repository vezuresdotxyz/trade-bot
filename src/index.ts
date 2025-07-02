import cron from "node-cron";
import { volumeBot } from "./controller/bibit/bot";
import { runBot } from "./controller/kucoin/bot";
console.log("volume bot started");

cron.schedule("* * * * *", async () => {
  console.log(`Running volume bot at every minute ${new Date().toISOString()}`);
  await volumeBot();
});

runBot();
