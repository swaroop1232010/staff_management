/**
 * UltraMsg WhatsApp Gateway Helper for Staff Management
 * Sends WhatsApp messages directly via QR-Linked Business Phone instance
 */

export interface UltraMsgSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<UltraMsgSendResult> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID || "instance194011";
  let token = process.env.ULTRAMSG_TOKEN;
  if (!token) {
    token = instanceId === "instance194285" ? "zrp1k82k8bhyhllf" : "b5tp2o693pet6kem";
  }
  if (instanceId.includes("194285")) {
    token = "zrp1k82k8bhyhllf";
  } else if (instanceId.includes("194011")) {
    token = "b5tp2o693pet6kem";
  }

  // Sanitize recipient phone number
  const cleanPhone = phone.replace(/\D/g, "");
  // Ensure country code (default to 91 for India if 10 digits)
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  if (!fullPhone) {
    return { success: false, error: "Invalid phone number provided" };
  }

  try {
    const url = `https://api.ultramsg.com/${instanceId}/messages/chat?token=${encodeURIComponent(token)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token,
        to: `+${fullPhone}`,
        body: message,
      }),
    });

    const result = (await response.json()) as Record<string, unknown>;

    if (!response.ok || result?.error) {
      const errMsg = (result?.error as string) || `UltraMsg returned status ${response.status}`;
      return {
        success: false,
        error: errMsg,
        details: result,
      };
    }

    return {
      success: true,
      messageId: (result?.id as string) || (result?.message as string) || "sent",
      details: result,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Network error contacting UltraMsg";
    return {
      success: false,
      error: errMsg,
    };
  }
}

/**
 * Sends a promotional image/flyer with caption via UltraMsg WhatsApp Gateway
 */
export async function sendWhatsAppImage(
  phone: string,
  imageUrl: string,
  caption?: string
): Promise<UltraMsgSendResult> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID || "instance194011";
  let token = process.env.ULTRAMSG_TOKEN;
  if (!token) {
    token = instanceId === "instance194285" ? "zrp1k82k8bhyhllf" : "b5tp2o693pet6kem";
  }
  if (instanceId.includes("194285")) {
    token = "zrp1k82k8bhyhllf";
  } else if (instanceId.includes("194011")) {
    token = "b5tp2o693pet6kem";
  }

  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  if (!fullPhone) {
    return { success: false, error: "Invalid phone number provided" };
  }

  try {
    const url = `https://api.ultramsg.com/${instanceId}/messages/image?token=${encodeURIComponent(token)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token,
        to: `+${fullPhone}`,
        image: imageUrl,
        caption: caption || "",
      }),
    });

    const result = (await response.json()) as Record<string, unknown>;

    if (!response.ok || result?.error) {
      const errMsg = (result?.error as string) || `UltraMsg returned status ${response.status}`;
      return {
        success: false,
        error: errMsg,
        details: result,
      };
    }

    return {
      success: true,
      messageId: (result?.id as string) || (result?.message as string) || "sent",
      details: result,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Network error contacting UltraMsg";
    return {
      success: false,
      error: errMsg,
    };
  }
}
