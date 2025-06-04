const nodemailer = require('nodemailer');
const pug = require('pug');
// const { MailtrapTransport } = require('mailtrap');
// const htmlToText = require('html-to-text');

// new Email(user, url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Leinad Nuieg <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // TODO: Configure your actual production email service (e.g., SendGrid, Brevo/Sendinblue)
      // Example for Brevo:
      return nodemailer.createTransport({
        service: 'SendinBlue', // or host/port for generic SMTP
        auth: {
          user: process.env.BREVO_EMAIL_USER,
          pass: process.env.BREVO_EMAIL_PASSWORD,
        },
      });
    }

    // 1. Create a transporter
    // The Transporter is basically a service that will send the email
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT, // Ensure port is an integer, e.g., 587, 465, or 2525
      auth: {
        user: process.env.EMAIL_USERNAME, // Directly use the env var
        pass: process.env.EMAIL_PASSWORD, // Changed 'password' to 'pass'
      },
      logger: true, // Add this
      debug: true, // And this (logs connection protocol)
    });
  }

  async send(template, subject) {
    // send the actual email
    // 1. Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    //pug.renderFile will take in a file and render the pug code to real HTML which we will save into an html variable

    // 2. Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      //text: htmlToText.fromString(html), //converting the html template to text format
      // html: options.html,
    };

    // 3. Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
    console.log('Email Sent Successfully');
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (Valid for only 10 minutes)',
    );
  }
};
