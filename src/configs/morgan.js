const morgan = require('morgan');
const Logger = require('../helpers/Logger');

const morganMessageFormatter = morgan.compile(':remote-addr - :remote-user | :method :url ▶ :status 💻 :user-agent (⌚ :response-time ms)');
// (':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":user-agent"')

const morganFormatter = (tokens, req, res) => {
  const message = morganMessageFormatter(tokens, req, res);

  try {
    let requestUrl;

    try {
      requestUrl = new URL(tokens.url(req, res), `${req.protocol}://${tokens.req(req, res, 'host')}`);
    } catch (error) {
      requestUrl = new URL(tokens.url(req, res), 'http://not.applicable');
    }

    let remoteIp = tokens['remote-addr'](req, res);

    if (tokens.req(req, res, 'x-forwarded-for')) {
      // this should be trusted only when using Google Cloud Load Balancer
      const forwardedIps = tokens.req(req, res, 'x-forwarded-for').split(',');
      if (forwardedIps.length >= 2) {
        forwardedIps.pop(); // remove last ip, it is the ip of the load balancer
        remoteIp = forwardedIps.pop();
      }
    }

    const httpRequest = {
      requestMethod: tokens.method(req, res),
      requestUrl,
      status: Number(tokens.status(req, res) || 0) || null,
      responseSize: tokens.res(req, res, 'content-length'),
      userAgent: tokens['user-agent'](req, res),
      remoteIp,
      serverIp: req.socket.localAddress,
      referer: tokens.referrer(req, res),
      protocol: req.protocol.toUpperCase(),
      latency: {},
    };

    const responseTime = Number(tokens['response-time'](req, res) || 0);

    if (responseTime) {
      httpRequest.latency = {
        seconds: Math.floor(responseTime / 1000),
        nanos: (responseTime % 1000) * 1000000,
      };
    }

    return JSON.stringify({ message, httpRequest });
  } catch (error) {
    // fallback to plain text formatter
    return JSON.stringify({ message });
  }
};

module.exports = morgan(morganFormatter, { stream: { write: message => Logger.morgan(message) } });
