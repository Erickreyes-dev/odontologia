import crypto from "node:crypto";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);

function getS3Config() {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!bucket || !region) {
    throw new Error("S3 no está configurado. Defina AWS_S3_BUCKET y AWS_REGION.");
  }

  return { bucket, region };
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function sha256(value: Buffer | string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

type AwsCredentials = { accessKeyId: string; secretAccessKey: string; sessionToken?: string };

async function getCredentials(): Promise<AwsCredentials> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (accessKeyId && secretAccessKey) return { accessKeyId, secretAccessKey, sessionToken };

  const containerCredentialsUrl = process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI
    || (process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ? `http://169.254.170.2${process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}` : null);

  if (containerCredentialsUrl) {
    const response = await fetch(containerCredentialsUrl, { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      return { accessKeyId: data.AccessKeyId, secretAccessKey: data.SecretAccessKey, sessionToken: data.Token };
    }
  }

  const tokenResponse = await fetch("http://169.254.169.254/latest/api/token", {
    method: "PUT",
    headers: { "X-aws-ec2-metadata-token-ttl-seconds": "21600" },
    cache: "no-store",
  }).catch(() => null);
  const token = tokenResponse?.ok ? await tokenResponse.text() : null;
  const metadataHeaders = token ? { "X-aws-ec2-metadata-token": token } : undefined;
  const roleResponse = await fetch("http://169.254.169.254/latest/meta-data/iam/security-credentials/", {
    headers: metadataHeaders,
    cache: "no-store",
  }).catch(() => null);

  if (roleResponse?.ok) {
    const roleName = (await roleResponse.text()).trim().split("\n")[0];
    const credentialsResponse = await fetch(`http://169.254.169.254/latest/meta-data/iam/security-credentials/${roleName}`, {
      headers: metadataHeaders,
      cache: "no-store",
    });
    if (credentialsResponse.ok) {
      const data = await credentialsResponse.json();
      return { accessKeyId: data.AccessKeyId, secretAccessKey: data.SecretAccessKey, sessionToken: data.Token };
    }
  }

  throw new Error("Credenciales AWS no disponibles. Use un rol IAM en producción o variables AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY en desarrollo.");
}

async function signedS3Request(method: "GET" | "PUT" | "DELETE", key: string, body?: Buffer, contentType?: string) {
  const { bucket, region } = getS3Config();
  const { accessKeyId, secretAccessKey, sessionToken } = await getCredentials();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const payloadHash = sha256(body ?? "");
  const canonicalUri = `/${encodeKey(key)}`;
  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (contentType) headers["content-type"] = contentType;
  if (sessionToken) headers["x-amz-security-token"] = sessionToken;

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort().map((name) => `${name}:${headers[name]}\n`).join("");
  const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, dateStamp), region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}${canonicalUri}`, {
    method,
    body: body ? new Uint8Array(body) : undefined,
    headers: { ...headers, authorization },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(`S3 respondió ${response.status}: ${message || response.statusText}`);
  }

  return response;
}

export async function uploadTenantImageToS3(params: { tenantId: string; file: File; folder: "logos" | "landing" }) {
  const { file, tenantId, folder } = params;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error("Seleccione una imagen PNG, JPG, WEBP, GIF o SVG.");
  if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error("La imagen es demasiado grande (máximo 2 MB).");

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || file.type.split("/").pop() || "bin";
  const key = `tenants/${tenantId}/${folder}/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await signedS3Request("PUT", key, buffer, file.type);
  return key;
}

export async function getTenantImageFromS3(key: string) {
  return signedS3Request("GET", key);
}

export async function deleteTenantImageFromS3(key: string) {
  return signedS3Request("DELETE", key);
}

export function mediaUrl(key: string | null | undefined) {
  return key ? `/api/media/${key}` : null;
}
