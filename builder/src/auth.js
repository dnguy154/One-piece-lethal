export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function checkBuilderPassword(password) {
  const expectedHash = import.meta.env.VITE_BUILDER_PASSWORD_HASH;

  if (!expectedHash) {
    console.error("Missing VITE_BUILDER_PASSWORD_HASH environment variable.");
    return false;
  }

  const inputHash = await sha256(password);

  return inputHash === expectedHash;
}

export function isBuilderAuthenticated() {
  return sessionStorage.getItem("builder-authenticated") === "true";
}

export function setBuilderAuthenticated() {
  sessionStorage.setItem("builder-authenticated", "true");
}

export function clearBuilderAuthenticated() {
  sessionStorage.removeItem("builder-authenticated");
}