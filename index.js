const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");
require("dotenv").config();

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

app.post("/webhook", line.middleware(config), async (req, res) => {
  const events = req.body.events;
  const results = await Promise.all(events.map(handleEvent));
  res.json(results);
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;

  const userInput = event.message.text;

  // ここでGPTに問い合わせ
  const gptResponse = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4-turbo",

      messages: [{ role: "user", content: userInput }],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const replyText = gptResponse.data.choices[0].message.content;

  // LINEに返信
  return client.replyMessage(event.replyToken, {
    type: "text",
    text: replyText,
  });
}
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Bot running on port ${port}`));
