const nodemailer = require('nodemailer');

// Create a transporter object using your email service provider's SMTP details
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to your email provider, like 'hotmail', 'yahoo', etc.
    auth: {
        user: 'vyankatesh.22310461@viit.ac.in', // Your email address
        pass: 'ltwf uqjq turv krpc'   // Your email password or App Password if using Gmail
    }
});

// Email options
const mailOptions = {
    from: 'vyankatesh.22310461@viit.ac.in',    // Sender address
    to: 'vyankateshkumbhar7@gmail.com',  // List of recipients
    subject: 'Test Email',           // Subject line
    text: 'Hello, this is a test email!',  // Plain text body
    html: '<h1>Hello, this is a test email!</h1>'  // HTML body
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('Error:', error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});
