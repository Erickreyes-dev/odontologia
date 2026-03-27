const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("Falta NEXT_PUBLIC_APP_URL para el retorno de PayPal");
  }

  const root = new URL(appUrl);
  const rootDomain = process.env.ROOT_DOMAIN?.trim();

  const host = LOCAL_HOSTS.has(root.hostname)
    ? `${tenantSlug}.${root.hostname}`
    : root.hostname === `${tenantSlug}.${rootDomain}` || root.hostname === `${tenantSlug}.${root.hostname}`
      ? root.hostname
      : `${tenantSlug}.${rootDomain ?? root.hostname}`;
  const port = root.port ? `:${root.port}` : "";
  return `${root.protocol}//${host}${port}/billing`;
}

export async function createPaypalOrder(amount: number, description: string, tenantSlug: string) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Monto inválido para crear la orden");
  }

  if (!tenantSlug?.trim()) throw new Error("No se pudo resolver el tenant para el retorno de PayPal");

  const token = await getAccessToken();
  const billingUrl = buildTenantBillingReturnUrl(tenantSlug);

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
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        user_action: "PAY_NOW",
        return_url: `${billingUrl}?paypal=success`,
        cancel_url: `${billingUrl}?paypal=cancelled`,
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
