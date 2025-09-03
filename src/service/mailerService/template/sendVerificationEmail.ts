import { sendEmail } from "../../../lib/smtp";


const sendVerificationEmail = async (data: any) => {
  const to = data.email;
  const verificationEmailUrl = data.code;
  const subject = "Email Verification";
  const html = `
  <html>
    <body>
      <div class="wrapper">
        <div class="container">
          <h2 style="margin-bottom: 10px">Verify your email</h2>
          <p class="para">
            Hi <span class="email"> ${to}!</span> use this code below to
            verify your email and start chatting.
          </p>
          <p class="code">${verificationEmailUrl}</p>
          <p class="para">code expire after 60 seconds</p>
        </div>
      </div>
    </body>
  </html>
        `;
  await sendEmail(to, subject, html);
};
export default sendVerificationEmail;