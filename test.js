// genarate exprees app
const express = require('express');
const { HttpClient } = require('./src/lib')
require('dotenv').config()
const http = new HttpClient({
  baseURL: process.env.BASE_URL_FACEBOOK
})

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function test() {
  const responseBooking = await http.post(`${process.env.BASE_URL_FACEBOOK}/${process.env.VERSION_API_FACEBOOK}/${process.env.APP_ID}/events`, {
    "data": [
      {
        "event_name": "purchase",
        "event_time": 1629424350,
        "action_source": "system_generated",
        "user_data": {
          "lead_id": 525645896321548
        },
        "custom_data": {
          "event_source": "crm",
          "lead_event_source": "toyota_crm"
        }
      }
    ]
  }
    , {
      params: {
        access_token: process.env.ACCESS_TOKEN_FACEBOOK
      }
    })

  console.log(responseBooking);
}
test().then(() => console.log)
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