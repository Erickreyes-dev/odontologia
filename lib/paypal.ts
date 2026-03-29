const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeRootHost(host: string): string {
  return host.trim().toLowerCase().replace(/^\./, "").replace(/^www\./, "");
}

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!clientId || !secret) {
    throw new Error("Credenciales de PayPal no configuradas");
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`No se pudo autenticar con PayPal: ${body || response.statusText}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

function buildTenantBillingReturnUrl(tenantSlug: string) {
  const appUrl =
    process.env.PLATFORM_PUBLIC_URL?.trim()
    || process.env.NEXT_PUBLIC_APP_URL?.trim()
    || process.env.NEXT_PUBLIC_PLATFORM_URL?.trim();
  const rootDomain = normalizeRootHost(process.env.ROOT_DOMAIN?.trim() || "medisoftcore.com");

  const root = appUrl ? new URL(appUrl) : new URL(`https://${tenantSlug}.${rootDomain}`);

  let host = root.hostname;
  if (LOCAL_HOSTS.has(root.hostname)) {
    host = root.hostname;
  } else if (rootDomain) {
    const normalizedHost = normalizeRootHost(root.hostname);
    const alreadyTenantHost = normalizedHost === `${tenantSlug}.${rootDomain}`;
    const isRootDomainHost = normalizedHost === rootDomain || normalizedHost.endsWith(`.${rootDomain}`);
    host = alreadyTenantHost || !isRootDomainHost ? root.hostname : `${tenantSlug}.${rootDomain}`;
  }

  const protocol = LOCAL_HOSTS.has(root.hostname) ? "http:" : root.protocol;
  const port = root.port ? `:${root.port}` : "";
  return `${protocol}//${host}${port}/billing`;
}

export async function createPaypalOrder(amount: number, description: string, tenantSlug: string) {
  if (!tenantSlug?.trim()) throw new Error("No se pudo resolver el tenant para el retorno de PayPal");
  const billingUrl = buildTenantBillingReturnUrl(tenantSlug);
  return createPaypalOrderWithContext(amount, description, {
    returnUrl: `${billingUrl}?paypal=success`,
    cancelUrl: `${billingUrl}?paypal=cancelled`,
  });
}

export async function createPaypalOrderWithContext(
  amount: number,
  description: string,
  context: {
    returnUrl: string;
    cancelUrl: string;
    customId?: string;
    invoiceId?: string;
  },
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Monto inválido para crear la orden");
  }

  const token = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description,
          ...(context.customId ? { custom_id: context.customId } : {}),
          ...(context.invoiceId ? { invoice_id: context.invoiceId } : {}),
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: "PAY_NOW",
            return_url: context.returnUrl,
            cancel_url: context.cancelUrl,
            landing_page: "GUEST_CHECKOUT",
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`No se pudo crear la orden de PayPal: ${body || response.statusText}`);
  }
  return response.json();
}

export async function capturePaypalOrder(orderId: string) {
  if (!orderId) throw new Error("OrderId de PayPal inválido");
  const token = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`No se pudo capturar la orden de PayPal: ${body}`);
  }

  return response.json();
}

export async function getPaypalOrder(orderId: string) {
  if (!orderId) throw new Error("OrderId de PayPal inválido");
  const token = await getAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`No se pudo consultar la orden de PayPal: ${body}`);
  }

  return response.json();
}
