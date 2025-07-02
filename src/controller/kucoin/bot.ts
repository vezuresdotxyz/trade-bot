import ccxt from "ccxt";
import nconf from "nconf";

import { tradeZEROUSDTKucoin } from "./trade";
import { sendSlackNotification } from "../../library/slack";

const DAILY_VOLUME = nconf.get("DAILY_VOLUME");
const MIN_TRADE_AMOUNT = nconf.get("MIN_TRADE_AMOUNT");
const MAX_TRADE_AMOUNT = nconf.get("MAX_TRADE_AMOUNT");
const MIN_SLEEP_MS = nconf.get("MIN_SLEEP_MS");
const MAX_SLEEP_MS = nconf.get("MAX_SLEEP_MS");

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTimeUntil12AM(): { milliseconds: number; formattedTime: string } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const timeUntil12AM = tomorrow.getTime() - now.getTime();

  const hours = Math.floor(timeUntil12AM / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntil12AM % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeUntil12AM % (1000 * 60)) / 1000);

  const formattedTime = `${hours}h ${minutes}m ${seconds}s`;

  return { milliseconds: timeUntil12AM, formattedTime };
}

export async function runBot() {
  const kucoin = new ccxt.kucoin({
    apiKey: nconf.get("KUCOIN_API_KEY"),
    secret: nconf.get("KUCOIN_SECRET_KEY"),
    password: nconf.get("KUCOIN_PASSWORD"),
    enableRateLimit: true,
  });

  let side: "buy" | "sell" = "buy";
  let dailyVolume = 0;
  let lastReset = Date.now();

  while (true) {
    if (Date.now() - lastReset > 24 * 60 * 60 * 1000) {
      dailyVolume = 0;
      lastReset = Date.now();
      await sendSlackNotification(
        nconf.get("SLACK_WEBHOOK_URL"),
        "Daily trade volume reset."
      );
    }

    if (dailyVolume >= DAILY_VOLUME) {
      const { milliseconds: sleepTime, formattedTime } = getTimeUntil12AM();
      await sendSlackNotification(
        nconf.get("SLACK_WEBHOOK_URL_KUCOIN"),
        `Daily trade volume target of $${DAILY_VOLUME} reached. Bot pausing until 12 AM. Further trades will resume in ${formattedTime}.`
      );
      console.log(
        `Daily volume target reached. Sleeping until 12 AM (${formattedTime})...`
      );
      await sleep(sleepTime);

      // Reset daily volume after sleeping until 12 AM
      dailyVolume = 0;
      lastReset = Date.now();
      await sendSlackNotification(
        nconf.get("SLACK_WEBHOOK_URL_KUCOIN"),
        "Bot resumed trading after 12 AM. Daily volume reset."
      );
      continue;
    }

    const amount = Number(
      randomInRange(MIN_TRADE_AMOUNT, MAX_TRADE_AMOUNT).toFixed(4)
    );
    const { success, usdVolume, price } = await tradeZEROUSDTKucoin(
      side,
      amount,
      kucoin,
      "limit"
    );

    const sleepMs = Math.floor(randomInRange(MIN_SLEEP_MS, MAX_SLEEP_MS));
    if (!success) {
      await sendSlackNotification(
        nconf.get("SLACK_WEBHOOK_URL_KUCOIN"),
        `:x: Trade Failed*\n• *Side:* ${side.toUpperCase()}\n• *Amount:* ${amount} ZERO\n• *Price:* $${
          price ?? "?"
        }`
      );
    } else if (success) {
      dailyVolume += usdVolume;
      await sendSlackNotification(
        nconf.get("SLACK_WEBHOOK_URL_KUCOIN"),
        `*✅ Trade Successful*\n• *Side:* ${side.toUpperCase()}\n• *Amount:* ${amount} ZERO\n• *Price:* $${
          price ?? "?"
        }\n• *Total USD Volume Today:* $${dailyVolume}\n⏳ Waiting *${
          sleepMs / 1000
        } seconds* before next trade...`
      );
    }

    side = side === "buy" ? "sell" : "buy";
    console.log(`Waiting ${sleepMs / 1000} seconds before next trade...`);
    await sleep(sleepMs);
  }
}
