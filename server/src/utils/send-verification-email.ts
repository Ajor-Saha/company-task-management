import nodemailer from "nodemailer";

const parseBoolean = (value: string | undefined, fallback: boolean) => {
    if (value === undefined) {
        return fallback;
    }
    return value.toLowerCase() === "true";
};

const parseNumber = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export async function sendVerificationEmail(email: string, firstName: string, verifyCode: string) {
    try {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (!emailUser || !emailPass) {
            return { success: false, message: "EMAIL_USER or EMAIL_PASS is not configured" };
        }

        const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
        const smtpPort = parseNumber(process.env.SMTP_PORT, 587);
        const smtpSecure = parseBoolean(process.env.SMTP_SECURE, smtpPort === 465);

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            requireTLS: !smtpSecure,
            auth: {
                user: emailUser,
                pass: emailPass,
            },
            connectionTimeout: 12000,
            greetingTimeout: 12000,
            socketTimeout: 15000,
            tls: {
                minVersion: "TLSv1.2",
            },
        });

        await transporter.verify();

        const mailOptions = {
            from: process.env.MAIL_FROM || emailUser,
            to: email,
            subject: "Verify Your Account",
            text: `Hello ${firstName},\n\nYour verification code is: ${verifyCode}\n\nUse this code to verify your account.`,
        };

        const info = await transporter.sendMail(mailOptions);

        return { success: true, message: `Email sent: ${info.response}` };
    } catch (error) {
        console.error("Error sending verification email:", error);
        const message = error instanceof Error ? error.message : "Failed to send verification email";
        return { success: false, message };
    }
}
