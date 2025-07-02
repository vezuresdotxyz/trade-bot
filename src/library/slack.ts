import axios from "axios";
import nconf from "nconf";

export const sendSlackNotification = async (
  webhookUrl: string,
  message: string
) => {
  console.log("sendSlackNotification");
  try {
    await axios.post(webhookUrl, { text: message });
    console.log("Slack notification sent");
  } catch (error) {
    console.error("Error sending Slack notification:", error);
  }
};
