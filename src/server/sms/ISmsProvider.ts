/**
 * ZANA Platform - SMS Provider Adapter Contract & Implementations
 *
 * Provides a pluggable, production-ready abstraction for sending verification
 * OTP messages to Iraqi mobile networks (Korek, Asiacell, Zain IQ).
 *
 * Default implementation is fail-closed (DisabledSmsProvider) when no credentials exist,
 * preventing accidental billing or silent failures.
 */

export interface SmsSendOptions {
  to: string; // Normalized E.164 phone (+9647XXXXXXXX)
  otp: string; // The 6-digit OTP code
  template?: string; // Optional message template in Kurdish Sorani
}

export interface SmsDeliveryResult {
  success: boolean;
  provider: string;
  messageId?: string;
  status: "delivered" | "queued" | "failed" | "disabled";
  error?: string;
  errorCode?: string;
}

export interface ISmsProvider {
  readonly name: string;
  readonly isConfigured: boolean;
  sendOtp(options: SmsSendOptions): Promise<SmsDeliveryResult>;
}

/**
 * Default Fail-Closed Provider
 * Active when no SMS provider credentials are configured.
 */
export class DisabledSmsProvider implements ISmsProvider {
  readonly name = "disabled";
  readonly isConfigured = false;

  async sendOtp(_options: SmsSendOptions): Promise<SmsDeliveryResult> {
    return {
      success: false,
      provider: this.name,
      status: "disabled",
      error: "SMS_PROVIDER_NOT_CONFIGURED",
      errorCode: "GATEWAY_PENDING_APPROVAL",
    };
  }
}

/**
 * Twilio SMS Adapter
 * Uses Twilio REST API v2010.
 */
export class TwilioSmsProvider implements ISmsProvider {
  readonly name = "twilio";
  readonly isConfigured: boolean;

  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumberOrSenderId: string
  ) {
    this.isConfigured = Boolean(accountSid && authToken && fromNumberOrSenderId);
  }

  async sendOtp(options: SmsSendOptions): Promise<SmsDeliveryResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        provider: this.name,
        status: "disabled",
        error: "Twilio credentials incomplete",
      };
    }

    const message = options.template || `کۆدی دڵنیایی زانا: ${options.otp}\nئەم کۆدە بۆ ٥ خولەک کارایە. تکایە بۆ کەسی مەبەخشە.`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: options.to,
      From: this.fromNumberOrSenderId,
      Body: message,
    });

    try {
      const authHeader = "Basic " + btoa(`${this.accountSid}:${this.authToken}`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = (await res.json().catch(() => ({}))) as {
        sid?: string;
        status?: string;
        error_message?: string;
        error_code?: number;
      };

      if (!res.ok || data.error_code) {
        return {
          success: false,
          provider: this.name,
          status: "failed",
          error: data.error_message || `Twilio HTTP ${res.status}`,
          errorCode: String(data.error_code || res.status),
        };
      }

      return {
        success: true,
        provider: this.name,
        messageId: data.sid,
        status: data.status === "delivered" ? "delivered" : "queued",
      };
    } catch (err) {
      return {
        success: false,
        provider: this.name,
        status: "failed",
        error: (err as Error)?.message || String(err),
      };
    }
  }
}

/**
 * Infobip SMS Adapter
 * Uses Infobip SMS API (highly supported for direct routing to Asiacell/Zain/Korek).
 */
export class InfobipSmsProvider implements ISmsProvider {
  readonly name = "infobip";
  readonly isConfigured: boolean;

  constructor(
    private apiKey: string,
    private baseUrl: string,
    private senderId = "ZANA"
  ) {
    this.isConfigured = Boolean(apiKey && baseUrl);
  }

  async sendOtp(options: SmsSendOptions): Promise<SmsDeliveryResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        provider: this.name,
        status: "disabled",
        error: "Infobip credentials incomplete",
      };
    }

    const cleanBaseUrl = this.baseUrl.replace(/\/+$/, "");
    const url = `${cleanBaseUrl}/sms/2/text/advanced`;
    const message = options.template || `کۆدی دڵنیایی زانا: ${options.otp}\nئەم کۆدە بۆ ٥ خولەک کارایە.`;

    const payload = {
      messages: [
        {
          from: this.senderId,
          destinations: [{ to: options.to }],
          text: message,
        },
      ],
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `App ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        messages?: Array<{ messageId?: string; status?: { name?: string; description?: string } }>;
      };

      if (!res.ok || !data.messages?.[0]) {
        return {
          success: false,
          provider: this.name,
          status: "failed",
          error: `Infobip HTTP ${res.status}`,
        };
      }

      const msgResult = data.messages[0];
      return {
        success: true,
        provider: this.name,
        messageId: msgResult.messageId,
        status: "queued",
      };
    } catch (err) {
      return {
        success: false,
        provider: this.name,
        status: "failed",
        error: (err as Error)?.message || String(err),
      };
    }
  }
}

/**
 * Generic Webhook SMS Adapter
 * Connects to local Iraqi telecom / SMPP gateways exposing an HTTP JSON endpoint.
 */
export class GenericWebhookSmsProvider implements ISmsProvider {
  readonly name = "webhook";
  readonly isConfigured: boolean;

  constructor(
    private webhookUrl: string,
    private webhookApiKey?: string
  ) {
    this.isConfigured = Boolean(webhookUrl);
  }

  async sendOtp(options: SmsSendOptions): Promise<SmsDeliveryResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        provider: this.name,
        status: "disabled",
        error: "Webhook URL not configured",
      };
    }

    const message = options.template || `کۆدی دڵنیایی زانا: ${options.otp}`;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.webhookApiKey) {
        headers["Authorization"] = `Bearer ${this.webhookApiKey}`;
      }

      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          recipient: options.to,
          message,
          otp: options.otp,
        }),
      });

      if (!res.ok) {
        return {
          success: false,
          provider: this.name,
          status: "failed",
          error: `Webhook HTTP ${res.status}`,
        };
      }

      return {
        success: true,
        provider: this.name,
        status: "queued",
      };
    } catch (err) {
      return {
        success: false,
        provider: this.name,
        status: "failed",
        error: (err as Error)?.message || String(err),
      };
    }
  }
}

/**
 * Mock SMS Provider for automated unit and integration tests only.
 */
export class MockSmsProvider implements ISmsProvider {
  readonly name = "mock";
  readonly isConfigured = true;
  public sentMessages: Array<{ to: string; otp: string; timestamp: number }> = [];

  async sendOtp(options: SmsSendOptions): Promise<SmsDeliveryResult> {
    this.sentMessages.push({
      to: options.to,
      otp: options.otp,
      timestamp: Date.now(),
    });

    return {
      success: true,
      provider: this.name,
      messageId: `mock-msg-${Date.now()}`,
      status: "delivered",
    };
  }
}

/**
 * Factory to instantiate the appropriate SMS provider from Cloudflare Worker environment.
 */
export function resolveSmsProvider(env: Record<string, unknown>): ISmsProvider {
  const providerType = (typeof env.SMS_PROVIDER === "string" ? env.SMS_PROVIDER.toLowerCase() : "").trim();

  // Test mode override
  if (providerType === "mock" && (env.NODE_ENV === "test" || env.ZANA_ENV === "test")) {
    return new MockSmsProvider();
  }

  if (providerType === "twilio") {
    const sid = typeof env.TWILIO_ACCOUNT_SID === "string" ? env.TWILIO_ACCOUNT_SID : "";
    const token = typeof env.TWILIO_AUTH_TOKEN === "string" ? env.TWILIO_AUTH_TOKEN : "";
    const from = typeof env.TWILIO_FROM === "string" ? env.TWILIO_FROM : "";
    if (sid && token && from) {
      return new TwilioSmsProvider(sid, token, from);
    }
  }

  if (providerType === "infobip") {
    const apiKey = typeof env.INFOBIP_API_KEY === "string" ? env.INFOBIP_API_KEY : "";
    const baseUrl = typeof env.INFOBIP_BASE_URL === "string" ? env.INFOBIP_BASE_URL : "";
    const sender = typeof env.INFOBIP_SENDER_ID === "string" ? env.INFOBIP_SENDER_ID : "ZANA";
    if (apiKey && baseUrl) {
      return new InfobipSmsProvider(apiKey, baseUrl, sender);
    }
  }

  if (providerType === "webhook") {
    const url = typeof env.SMS_WEBHOOK_URL === "string" ? env.SMS_WEBHOOK_URL : "";
    const key = typeof env.SMS_WEBHOOK_KEY === "string" ? env.SMS_WEBHOOK_KEY : undefined;
    if (url) {
      return new GenericWebhookSmsProvider(url, key);
    }
  }

  // Default fail-closed provider
  return new DisabledSmsProvider();
}
