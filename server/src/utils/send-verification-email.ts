import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

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

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedTransportKey = "";

const getBaseAuth = () => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        throw new Error("EMAIL_USER or EMAIL_PASS is not configured");
    }

    return { emailUser, emailPass };
};

const buildTransportOptions = (): SMTPTransport.Options[] => {
    const { emailUser, emailPass } = getBaseAuth();
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const envPort = process.env.SMTP_PORT;

    // If user provides explicit SMTP port, use exactly that config.
    if (envPort) {
        const port = parseNumber(envPort, 587);
        const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);
        return [
            {
                host,
                port,
                secure,
                requireTLS: !secure,
                auth: { user: emailUser, pass: emailPass },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 12000,
                dnsTimeout: 10000,
                tls: { minVersion: "TLSv1.2" },
            },
        ];
    }

    // Gmail-friendly fallback order: STARTTLS on 587, then implicit TLS on 465.
    return [
        {
            host,
            port: 587,
            secure: false,
            requireTLS: true,
            auth: { user: emailUser, pass: emailPass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 12000,
            dnsTimeout: 10000,
            tls: { minVersion: "TLSv1.2" },
        },
        {
            host,
            port: 465,
            secure: true,
            auth: { user: emailUser, pass: emailPass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 12000,
            dnsTimeout: 10000,
            tls: { minVersion: "TLSv1.2" },
        },
    ];
};

const getTransportKey = (options: SMTPTransport.Options) =>
    `${options.host}:${options.port}:${options.secure}:${options.requireTLS}`;

async function getVerifiedTransporter() {
    const optionsList = buildTransportOptions();
    let lastError: unknown;

    for (const options of optionsList) {
        const key = getTransportKey(options);
        const isCachedMatch = cachedTransporter && cachedTransportKey === key;

        if (!isCachedMatch) {
            cachedTransporter = nodemailer.createTransport(options);
            cachedTransportKey = key;
        }

        try {
            await cachedTransporter!.verify();
            return cachedTransporter!;
        } catch (error) {
            lastError = error;
            cachedTransporter = null;
            cachedTransportKey = "";
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("SMTP verification failed for all configured transports");
}

export async function sendVerificationEmail(email: string, firstName: string, verifyCode: string) {
    try {
        const { emailUser } = getBaseAuth();
        const transporter = await getVerifiedTransporter();

        const mailOptions: Mail.Options = {
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
