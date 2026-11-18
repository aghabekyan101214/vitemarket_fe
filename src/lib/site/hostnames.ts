/**
 * Mirror of backend `core/hostnames.py`: trim, strip port, strip trailing dot, lowercase,
 * IDN → punycode. IPs and single-label hosts are rejected (they are never site domains).
 * Returns null instead of throwing: an invalid Host is simply "no site".
 */
const LABEL_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const MAX_HOSTNAME_LENGTH = 253;

export function normalizeHost(value: string | null | undefined): string | null {
  const host = (value ?? "").trim();
  if (!host || host.startsWith("[")) return null; // empty or IPv6 literal

  let name = host;
  if (host.split(":").length === 2) {
    const [h, port] = host.split(":") as [string, string];
    if (!/^\d+$/.test(port)) return null;
    name = h;
  } else if (host.includes(":")) {
    return null;
  }
  name = name.replace(/\.+$/, "").toLowerCase();
  if (!name || /[/\\?#@\s]/.test(name)) return null;

  let ascii: string;
  try {
    ascii = new URL(`http://${name}`).hostname; // UTS-46 mapping + punycode
  } catch {
    return null;
  }

  const labels = ascii.split(".");
  if (ascii.length > MAX_HOSTNAME_LENGTH || labels.length < 2) return null;
  if (!labels.every((l) => LABEL_RE.test(l))) return null;
  if (labels.every((l) => /^\d+$/.test(l))) return null; // IPv4
  return ascii;
}

/** Looser form for dev aliases only (`localhost`, `127.0.0.1` style hosts are allowed). */
export function looseHost(value: string | null | undefined): string | null {
  const host = (value ?? "").trim().toLowerCase();
  if (!host) return null;
  const name = host.startsWith("[") ? host.slice(0, host.indexOf("]") + 1) : host.split(":")[0]!;
  return name.replace(/\.+$/, "") || null;
}
