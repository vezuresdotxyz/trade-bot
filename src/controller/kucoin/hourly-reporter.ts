import ccxt from "ccxt";
import nconf from "nconf";
import { sendSlackNotification } from "../../library/slack";

async function generateHourlyReport() {
  console.log("📊 Generating Simple Hourly Report...");
  
  const kucoin = new ccxt.kucoin({
    apiKey: nconf.get("KUCOIN_API_KEY"),
    secret: nconf.get("KUCOIN_SECRET_KEY"),
    password: nconf.get("KUCOIN_PASSWORD"),
    enableRateLimit: true,
  });

  try {
    const symbol = "ZERO-USDT";
    
    const openOrders = await kucoin.fetchOpenOrders(symbol);
    const openOrdersCount = openOrders.length;
    
    const recentTrades = await kucoin.fetchMyTrades(symbol, undefined, 150);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const last24HoursTrades = recentTrades.filter((trade: any) => trade.timestamp > oneDayAgo);
    

    const buyTrades = last24HoursTrades.filter((trade: any) => trade.side === 'buy');
    const sellTrades = last24HoursTrades.filter((trade: any) => trade.side === 'sell');
    
    const buyCount = buyTrades.length;
    const sellCount = sellTrades.length;
    
    const totalUsdVolume = last24HoursTrades.reduce((sum: number, trade: any) => sum + trade.cost, 0);
    
    const balance = await kucoin.fetchBalance();
    const freeBalances = balance.free as unknown as Record<string, number>;
    const zeroBalance = freeBalances["ZERO"] || 0;
    const usdtBalance = freeBalances["USDT"] || 0;
    
    // Send to Slack
    const message = `📊 *Hourly Report* - ${new Date().toLocaleString()}

📈 *Trading Activity (Last 24h):*
• Buy Trades: ${buyCount}
• Sell Trades: ${sellCount}
• Open Orders: ${openOrdersCount}
• USD Volume: $${totalUsdVolume}

💰 *Current Balances:*
• ZERO: ${zeroBalance}
• USDT: ${usdtBalance}`;

    await sendSlackNotification(
      nconf.get("SLACK_WEBHOOK_URL_KUCOIN"),
      message
    );
    
    console.log("✅ Hourly report sent to Slack");
    
  } catch (error: any) {
    console.error("❌ Error generating hourly report:", error.message);
  }
}

export { generateHourlyReport }; 