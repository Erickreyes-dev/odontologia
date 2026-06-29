function encodeKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function mediaUrl(key: string | null | undefined) {
  return key ? `/api/media/${encodeKey(key)}` : null;
}
