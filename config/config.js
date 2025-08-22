module.exports = {
  //apiUrl: "/api/v1",
  apiUrl: '',
  port: 5173,
  portTech: 5174,
  limiter: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // 100 requests max
  },
  earthRadius: {
    km: 6378,
    miles: 3963,
  },
  cookiesExpire: 24 * 60 * 60 * 1000,
  events: {
    cryptoRefresh: 5 * 1000,
  },
  tokenExpires: 10 * 1000,
  domain: {
    development: `http://localhost:5173`,
    production: `https://www.techbudget.io`,
  },
  allowedOrigins: [
    `http://localhost:5173`,
    `http://localhost:5174`,
    `http://localhost`,
    `https://localhost`,
    `https://techbudget.io`,
    `https://www.techbudget.io`,
    `https://encuestas.halo.cl`,
  ],
  emailSender: 'gogogol',
}
