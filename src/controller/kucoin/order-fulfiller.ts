import ccxt from "ccxt";
import nconf from "nconf";
import { sendSlackNotification } from "../../library/slack";

async function fulfillOpenOrders(dailyVolume: number = 0) {
  console.log("🎯 Fulfilling Pending Sell Orders...");

  const kucoin = new ccxt.kucoin({
    apiKey: nconf.get("KUCOIN_API_KEY"),
    secret: nconf.get("KUCOIN_SECRET_KEY"),
    password: nconf.get("KUCOIN_PASSWORD"),
    enableRateLimit: true,
  });

  try {
    const symbol = "ZERO-USDT";
    const openOrders = await kucoin.fetchOpenOrders(symbol);

    const sellOrders = openOrders.filter((order: any) => order.side === "sell");

    console.log(`📋 Found ${sellOrders.length} pending sell orders to fulfill`);

    if (sellOrders.length === 0) {
      console.log("✅ No pending sell orders found");
      return dailyVolume;
    }

    let totalFulfilledVolume = 0;

    for (const order of sellOrders) {
      try {
        console.log(
          `🔄 Processing sell order ${order.id} (${order.remaining} ZERO at $${order.price})`
        );

        const amount = order.remaining;
        const price = order.price;

        const buyOrder = await kucoin.createOrder(
          symbol,
          "limit",
          "buy",
          amount,
          price
        );

        console.log(
          `✅ Created buy order ${buyOrder.id} to fulfill sell order ${order.id}`
        );

        const usdVolume = amount * price;
        totalFulfilledVolume += usdVolume;

        const message = `
:white_tick: *Trade Successful*
*Pending Sell Order Fulfillment*

📈 *Side:* BUY
💰 *Amount:* ${amount} ZERO
💵 *Price:* $${price}
📊 *Buy Order ID:* ${buyOrder.id}
🎯 *Fulfilling Sell Order:* ${order.id}
💸 *Trade Value:* $${usdVolume}
📈 *Total USD Volume Today:* $${dailyVolume + totalFulfilledVolume} \n`;

        await sendSlackNotification(
          nconf.get("SLACK_WEBHOOK_URL_KUCOIN"),
          message
        );

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        await sendSlackNotification(
          nconf.get("SLACK_WEBHOOK_URL_KUCOIN"),
          `❌ Error fulfilling sell order ${order.id}: ${error.message}`
        );
        console.error(
          `❌ Error fulfilling sell order ${order.id}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Sell order fulfillment completed - processed ${sellOrders.length} orders`
    );
    console.log(
      `📊 Total fulfilled volume: $${totalFulfilledVolume.toFixed(2)}`
    );

    return dailyVolume + totalFulfilledVolume;
  } catch (error: any) {
    console.error("❌ Error in order fulfillment:", error.message);
    return dailyVolume;
  }
}

export { fulfillOpenOrders };
