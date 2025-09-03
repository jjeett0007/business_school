import { sendEmail } from "../../../lib/smtp";
import {config} from "../../../config";

const changePassword = async (data: any) => {
  const { email, token } = data;

  const subject = "Reset Password link";

  const link = `${config.protocol.frontend_origin}/reset-password/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
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
        
        .reset-box {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 30px 20px;
        margin: 20px 0;
        text-align: center;
        }
        
        .reset-icon {
        width: 60px;
        height: 60px;
        margin-bottom: 15px;
        }
        
        .reset-message {
        font-size: 16px;
        color: #333333;
        margin-bottom: 25px;
        }
        
        .security-note {
        background-color: #f9f9f9;
        border-left: 4px solid rgb(151, 70, 255);
        padding: 15px;
        margin: 20px 0;
        font-size: 13px;
        color: #555555;
        }
        
        .cta-button {
        display: inline-block;
        background-color: rgb(151, 70, 255);
        color: white;
        text-decoration: none;
        text-align: center;
        padding: 14px 30px;
        border-radius: 6px;
        font-weight: bold;
        font-size: 16px;
        }
        
        .expiration {
        font-size: 13px;
        color: #777777;
        margin-top: 15px;
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
            display: block;
            width: 100%;
            box-sizing: border-box;
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
                    <p style="margin-top: 0;">Hello,</p>
                    <p>We received a request to reset your password. If you made this request, please use the button below to reset your password.</p>
                    
                    <!-- Reset Box -->
                    <div class="reset-box">
                        <img src="https://cdn-icons-png.flaticon.com/512/6195/6195699.png" alt="Lock Icon" class="reset-icon">
                        <p class="reset-message">Click the button below to reset your password and regain access to your account.</p>
                        <a href="${link}" class="cta-button">Reset Password</a>
                        <p class="expiration">This link will expire in 5 minutes.</p>
                    </div>
                    
                    <div class="security-note">
                        <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email or contact our support team immediately. Someone may be trying to access your account.
                    </div>
                    
                    <p>This link is only active for 5 minutes.</p>
                    <p>For security reasons, this password reset link can only be used once. If you need to reset your password again, please request a new link.</p>
                    
                    <p style="margin-bottom: 0;">Thank you,</p>
                    <p style="margin-top: 5px;">The Support Team</p>
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

export default changePassword;