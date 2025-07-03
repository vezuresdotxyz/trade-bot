import ccxt from "ccxt";
import { sendSlackNotification } from "../../library/slack";

export async function tradeZEROUSDTKucoin(
  side: "buy" | "sell",
  amount: number,
  kucoin: any,
  orderType: "market" | "limit" = "limit",
  price?: number
): Promise<{ success: boolean; usdVolume: number; price: number }> {
  try {
    const symbol = "ZERO-USDT";
    const balances = await kucoin.fetchBalance();
    const freeBalances = balances.free as unknown as Record<string, number>;

    const ticker = await kucoin.fetchTicker(symbol);
    let tradePrice = side === "buy" ? ticker.ask : ticker.bid;
    if (!tradePrice) {
      console.log(":x: Could not fetch price for", symbol);
      return { success: false, usdVolume: 0, price: 0 };
    }

    if (side === "buy") {
      const requiredUSDT = amount * tradePrice;
      const usdtBalance = freeBalances["USDT"] || 0;
      if (usdtBalance < requiredUSDT) {
        console.log(":x: Not enough USDT to buy", amount, "ZERO");
        return { success: false, usdVolume: 0, price: tradePrice };
      }
    } else if (side === "sell") {
      const zeroBalance = freeBalances["ZERO"] || 0;
      if (zeroBalance < amount) {
        console.log(":x: Not enough ZERO to sell", amount, "ZERO");
        return { success: false, usdVolume: 0, price: tradePrice };
      }
    }

    let finalPrice = price;
    if (orderType === "limit" && !finalPrice) {
      const orderbook = await kucoin.fetchOrderBook(symbol);
      if (side === "sell") {
        // const bestAsk = orderbook.asks[0]?.[0];
        finalPrice = tradePrice;
      } else {
        const bestAsk = orderbook.asks[0]?.[0];
        const bestBid = orderbook.bids[0]?.[0];

        if (bestAsk && bestBid) {
          finalPrice = (bestAsk + bestBid) / 2;
        } else {
          finalPrice = tradePrice;
        }
      }
    }

    let order;
    if (orderType === "limit") {
      order = await kucoin.createOrder(
        symbol,
        "limit",
        side,
        amount,
        finalPrice
      );
    } else {
      order = await kucoin.createOrder(symbol, "market", side, amount);
    }
    console.log(":white_tick: Order placed:", order);

    const usdVolume = amount * tradePrice;

    return { success: true, usdVolume, price: tradePrice };
  } catch (err: any) {
    console.error(":x: Error:", err.message || err);
    return { success: false, usdVolume: 0, price: 0 };
  }
}
