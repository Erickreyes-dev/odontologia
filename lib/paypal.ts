const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

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

export async function createPaypalOrder(amount: number, description: string) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Monto inválido para crear la orden");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("Falta NEXT_PUBLIC_APP_URL para el retorno de PayPal");
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
          amount: {
            currency_code: "USD",
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        user_action: "PAY_NOW",
        return_url: `${appUrl}/billing?paypal=success`,
        cancel_url: `${appUrl}/billing?paypal=cancelled`,
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
