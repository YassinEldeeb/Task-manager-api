const sgMail = require("@sendgrid/mail")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

//Signup new user
const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    from: "yassineldeeb94@gmail.com",
    to: email,
    subject: "Thanks for joining in!",
    text: `Welcome to the app ${name}. Let me know how you get along with the app`,
  })
}

//Deleting user account
const sendCancelationEmail = (email, name) => {
  sgMail.send({
    from: "yassineldeeb94@gmail.com",
    to: email,
    subject: "Sorry to see you go!",
    text: `Goodbye, ${name}. I hope to see you back sometime soon.`,
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
}
