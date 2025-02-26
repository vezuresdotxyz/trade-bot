import ccxt from "ccxt";
import nconf from "nconf";

const apiKey = nconf.get("API_KEY");
const apiSecret = nconf.get("API_SECRET");
import { sendSlackNotification } from "./library/slack";

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
    const usdtAmount = 10; // Amount in USDT
    const amount = usdtAmount / currentPrice; // Convert USDT to ZERO amount

    // Get account balance
    const balance = await bybit.fetchBalance();
    console.log(balance.ZERO);

    if (buy) {
      console.log("Buy Order Executed");
      await bybit.createMarketBuyOrder(symbol, amount);
      // sendSlackNotification(
      //   "Buy Order Executed " + amount + " " + symbol + " at " + currentPrice
      // );
      buy = false;
    } else {
      console.log("Sell Order Executed");
      await bybit.createMarketSellOrder(symbol, amount);
      // sendSlackNotification(
      //   "Sell Order Executed " + amount + " " + symbol + " at " + currentPrice
      // );
      buy = true;
    }
  } catch (error) {
    console.error("Error:", error);
    sendSlackNotification(`Error: ${error}`);
  }
};
