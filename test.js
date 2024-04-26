// genarate exprees app
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/webhook", async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === 'abc123') {
    res.send(challenge)
  } else {
    console.log('WEBHOOK_VERIFIED');
    res.sendStatus(403);
  }
})

app.post('/webhook', async (req, res) => {
  const { body } = req;
  console.log('body', JSON.stringify(body, null, 2))
  return res.sendStatus(200)
})

app.listen(3000, () => {
  console.log('Server is running on port 3000');
})