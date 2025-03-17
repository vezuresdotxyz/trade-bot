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
    console.log(balance);

    if (buy) {
      console.log("Buy Order Executed");

      //before making a buy order, check if the usdt balance is enough to buy the amount
      //check if usdt balance is greater than 20 $ before making a buy order
      if (Number(balance.USDT.total) < 30) {
        console.log("Insufficient balance");
        sendSlackNotification(
          `Insufficient balance to buy ZERO: ${balance.USDT.total}`
        );
        // await bybit.createMarketSellOrder(symbol, amount);
        // buy = true;
        // return;
      }
      await bybit.createMarketBuyOrder(symbol, amount);
      buy = false;
    } else {
      console.log("Sell Order Executed");
      // zero should be  greter than 300000 Zero
      if (Number(balance.ZERO.total) < 300000) {
        console.log("Insufficient balance");
        sendSlackNotification(
          `Insufficient balance to sell ZERO: ${balance.ZERO.total}`
        );
        return;
      }
      await bybit.createMarketSellOrder(symbol, amount);
      buy = true;
    }
  } catch (error) {
    console.error("Error:", error);
    sendSlackNotification(`Error: ${error}`);
  }
};
