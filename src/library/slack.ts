import axios from "axios";
import nconf from "nconf";

export const sendSlackNotification = async (message: string) => {
  console.log("sendSlackNotification");
  try {
    await axios.post(nconf.get("SLACK_WEBHOOK_URL"), { text: message });
    console.log("Slack notification sent");
  } catch (error) {
    console.error("Error sending Slack notification:", error);
  }
};
