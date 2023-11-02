
const emailAuth = require('../config/configEnv');
const nodemailer = require("nodemailer");

const {host, port, auth} = emailAuth
const transporter = nodemailer.createTransport({
  host,
  port,
  //secure: false,
  auth,
  //TODO: Enviroment not working on transport, figure it out
  // host: process.env.SMTP_HOST,
  // port: process.env.SMTP_PORT,
  // // secure: true,
  // auth: {
  //   user: process.env.SMTP_EMAIL,
  //   pass: process.env.SMTP_PASSWORD,
  // },
});

// async..await is not allowed in global scope, must use a wrapper
const sendEmail = async (options) => {
  // send mail with defined transport object
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email, // list of receivers
    subject: options.subject,
    text: options.message,
    html: `${options.message}`,
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;
