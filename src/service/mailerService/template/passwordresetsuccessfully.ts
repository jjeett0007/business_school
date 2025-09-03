import { sendEmail } from "../../../lib/smtp";


const passwordChangedConfirmationMail = async (data: any) => {
  const { email, name, date, device, location } = data;

  const subject = "Password Reset Successful";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful</title>
    <style type="text/css">
        /* Reset styles */
        body, p, td, th {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        padding: 0;
        }
        
        /* Base styles */
        .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        }
        
        /* Header styles */
        .header {
        background-color: rgba(150, 70, 255, 0.37);
        padding: 20px;
        text-align: center;
        }
        
        .header-logo {
        width: 200px;
        height: auto;
        }
        
        .header-text {
        color: white;
        font-size: 24px;
        font-weight: bold;
        margin: 10px 0;
        }
        
        /* Content styles */
        .content {
        padding: 30px 20px;
        background-color: white;
        }
        
        .success-box {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
        }
        
        .success-icon {
        width: 70px;
        height: 70px;
        margin: 0 auto 15px;
        display: block;
        }
        
        .success-title {
        font-size: 20px;
        font-weight: bold;
        color: rgb(151, 70, 255);
        margin-bottom: 15px;
        }
        
        .success-message {
        color: #555;
        margin-bottom: 20px;
        }
        
        .details-box {
        background-color: #f9f9f9;
        border-radius: 6px;
        padding: 15px;
        margin: 20px 0;
        text-align: left;
        }
        
        .detail-row {
        display: flex;
        margin-bottom: 10px;
        align-items: flex-start;
        }
        
        .detail-label {
        width: 120px;
        color: #666;
        font-weight: 500;
        }
        
        .detail-value {
        flex: 1;
        color: #333;
        }
        
        .security-alert {
        background-color: rgb(151, 70, 255, 0.1);
        border-left: 4px solid rgb(151, 70, 255);
        padding: 15px;
        margin: 25px 0;
        border-radius: 4px;
        }
        
        .security-title {
        font-size: 16px;
        font-weight: bold;
        color: rgb(151, 70, 255);
        margin-bottom: 10px;
        }
        
        .next-steps {
        margin-top: 25px;
        }
        
        .steps-title {
        font-weight: bold;
        color: #555;
        margin-bottom: 10px;
        }
        
        .steps-list {
        margin: 0;
        padding-left: 20px;
        }
        
        .steps-list li {
        margin-bottom: 8px;
        color: #555;
        }
        
        .cta-button {
        display: block;
        background-color: rgb(151, 70, 255);
        color: white;
        text-decoration: none;
        text-align: center;
        padding: 14px 20px;
        border-radius: 6px;
        font-weight: bold;
        margin: 30px auto;
        width: 200px;
        }
        
        /* Footer styles */
        .footer {
        background-color: #f9f9f9;
        padding: 20px;
        text-align: center;
        color: #666666;
        font-size: 12px;
        }
        
        .social-links {
        margin: 15px 0;
        }
        
        .social-link {
        display: inline-block;
        margin: 0 10px;
        }
        
        .social-icon {
        width: 24px;
        height: 24px;
        }
        
        @media screen and (max-width: 480px) {
        .header-text {
            font-size: 20px;
        }
        
        .cta-button {
            width: 100%;
        }
        
        .detail-row {
            flex-direction: column;
        }
        
        .detail-label {
            width: 100%;
            margin-bottom: 4px;
        }
        }
    </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
        <td align="center" style="padding: 20px 0;">
            <!-- Email Container -->
            <table class="email-container" width="600" border="0" cellspacing="0" cellpadding="0">
            
            <!-- Content -->
            <tr>
                <td class="content">
                <p style="margin-top: 0;">Hello ${name},</p>
                <p>We're confirming that your password has been successfully reset.</p>
                
                <!-- Success Box -->
                <div class="success-box">
                    <img src="https://cdn-icons-png.flaticon.com/512/190/190411.png" alt="Success Icon" class="success-icon">
                    <div class="success-title">Your password has been changed</div>
                    <div class="success-message">Your account is now secured with your new password.</div>
                </div>
                
                <!-- Details Box -->
                <div class="details-box">
                    <div class="detail-row">
                    <div class="detail-label">Account:</div>
                    <div class="detail-value">${email}</div>
                    </div>
                    <div class="detail-row">
                    <div class="detail-label">Date & Time:</div>
                    <div class="detail-value">${date}</div>
                    </div>
                    ${
                      device
                        ? `
                        <div class="detail-row">
                            <div class="detail-label">Device:</div>
                            <div class="detail-value">${device}</div>
                        </div>
                        `
                        : ""
                    }
                    
                    ${
                      location
                        ? `
                       <div class="detail-row">
                          <div class="detail-label">Location:</div>
                          <div class="detail-value">${location}</div>
                        </div>
                      `
                        : ""
                    }
                   
                </div>
                
                <div class="security-alert">
                    <div class="security-title">Didn't reset your password?</div>
                    <p>If you didn't request this password change, please contact our support team immediately or click the button below to secure your account.</p>
                </div>
                
                <a href="#" class="cta-button">Report Unauthorized Change</a>
                
                <div class="next-steps">
                    <div class="steps-title">Next Steps:</div>
                    <ul class="steps-list">
                    <li>Update your password on any other devices where you're signed in</li>
                    <li>Consider enabling two-factor authentication for additional security</li>
                    <li>Make sure your email account is also secured with a strong password</li>
                    </ul>
                </div>
                
                <p style="margin-bottom: 0;">Stay secure,</p>
                <p style="margin-top: 5px;">The Security Team</p>
                </td>
            </tr>
            </table>
        </td>
        </tr>
    </table>
    </body>
    </html>
  `;

  await sendEmail(email, subject, html);
};
export default passwordChangedConfirmationMail;