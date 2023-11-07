module.exports = {
  //apiUrl: "/api/v1",
  apiUrl: '',
  port: 3000,
  limiter: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // 100 requests max
  },
  earthRadius: {
    km: 6378,
    miles: 3963,
  },
  cookiesExpire: 24 * 60 * 60 * 1000,
  tokenExpires: 10 * 1000,
  domain: {
    development: `http://localhost:3000`,
    production: `https://www.techbudget.io`,
  },
  apiGogogol: {
    sendEmail: `https://www.gogogol.com/lib/endpoints/tb.POST.sendEmail.php`,
  },
  emailSender: 'gogogol',
}
