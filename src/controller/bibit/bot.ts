import ccxt from "ccxt";
import nconf from "nconf";

import {
  USDT_AMOUNT,
  USDT_AMOUNT_LIMIT,
  ZERO_QUANTITY_LIMIT,
} from "../constants";
const apiKey = nconf.get("BYBIT_API_KEY");
const apiSecret = nconf.get("BYBIT_API_SECRET");
import { sendSlackNotification } from "../../library/slack";

// Initialize the Bybit client
const bybit = new ccxt.bybit({
  apiKey: apiKey,
  secret: apiSecret,
  enableRateLimit: true,
});

// Set the market you want to trade (e.g., BTC/USDT)
const symbol = "ZERO/USDT";
let buy = true;

export const volumeBot = async () => {
  try {
    const ticker = await bybit.fetchTicker(symbol);
    const currentPrice: any = ticker.last;
    console.log(`Current Market Price of ZERO: $${currentPrice}`);

    // Define how much ZERO to buy (e.g., $10 worth of ZERO)
    const amount = USDT_AMOUNT / currentPrice; // Convert USDT to ZERO amount

    // Get account balance
    const balance = await bybit.fetchBalance();
    console.log(balance);

    if (buy) {
      console.log("Buy Order Executed");

      //before making a buy order, check if the usdt balance is enough to buy the amount
      //check if usdt balance is greater than 20 $ before making a buy order
      if (Number(balance.USDT.total) < USDT_AMOUNT_LIMIT) {
        console.log("Insufficient balance");
        sendSlackNotification(
          nconf.get("SLACK_WEBHOOK_URL_BIBIT"),
          `Insufficient balance to buy ZERO: ${balance.USDT.total}`
        );
        await bybit.createMarketSellOrder(symbol, amount);
        buy = true;
        return;
      }
      await bybit.createMarketBuyOrder(symbol, amount);
      buy = false;
    } else {
      console.log("Sell Order Executed");
      // zero should be  greter than 300000 Zero
      if (Number(balance.ZERO.total) < ZERO_QUANTITY_LIMIT) {
        console.log("Insufficient balance");
        sendSlackNotification(
          nconf.get("SLACK_WEBHOOK_URL_BIBIT"),
          `Insufficient balance to sell ZERO: ${balance.ZERO.total}`
        );
        return;
      }
      await bybit.createMarketSellOrder(symbol, amount);
      buy = true;
    }
  } catch (error) {
    console.error("Error:", error);
    sendSlackNotification(
      nconf.get("SLACK_WEBHOOK_URL_BIBIT"),
      `Error: ${error}`
    );
    buy = buy ? false : true;
  }
};
