export type MetaExchangeResponse = {
  access_token: string;
  token_type: string;
  expires_in?: number;
};

export type MetaPhoneAsset = {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
};

function getGraphBaseUrl() {
  return process.env.META_GRAPH_BASE_URL ?? "https://graph.facebook.com/v21.0";
}

export async function exchangeMetaCode(code: string, redirectUri: string): Promise<MetaExchangeResponse> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Faltan credenciales de Meta en variables de entorno");
  }

  const url = new URL(`${getGraphBaseUrl()}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Error de Meta OAuth: ${response.status}`);
  }

  return response.json() as Promise<MetaExchangeResponse>;
}

export async function sendMetaTextMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  body: string;
}) {
  const response = await fetch(`${getGraphBaseUrl()}/${params.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: params.to,
      type: "text",
      text: { body: params.body },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error enviando texto a Meta: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<{ messages?: Array<{ id: string }> }>;
}

export async function sendMetaDocumentMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  documentUrl: string;
  filename?: string;
  caption?: string;
}) {
  const response = await fetch(`${getGraphBaseUrl()}/${params.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: params.to,
      type: "document",
      document: {
        link: params.documentUrl,
        filename: params.filename,
        caption: params.caption,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error enviando documento a Meta: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<{ messages?: Array<{ id: string }> }>;
}
