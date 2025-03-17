import nconf from "nconf";
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(nconf.get("TELEGRAM_BOT_TOKEN"), { polling: true });

// Send a message function
function sendMessage(message: string) {
  bot.sendMessage(nconf.get("CHAT_ID"), message);
}

// Handle messages from users
bot.on("message", (msg: any) => {
  console.log(`Received message from ${msg.chat.id}: ${msg.text}`);
  sendMessage(`You said: ${msg.text}`);
});

// Example usage
setTimeout(() => {
  sendMessage("Hello! This is a test notification.");
}, 5000);
