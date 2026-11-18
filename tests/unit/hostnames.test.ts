import { describe, expect, it } from "vitest";
import { looseHost, normalizeHost } from "@/lib/site/hostnames";

describe("normalizeHost (mirror of backend core/hostnames.py)", () => {
  it.each([
    ["Nordic-Home-DE.localhost", "nordic-home-de.localhost"],
    ["  shop.example.com  ", "shop.example.com"],
    ["shop.example.com:3000", "shop.example.com"],
    ["shop.example.com.", "shop.example.com"],
    ["SHOP.Example.COM.:443", "shop.example.com"],
    ["möbel.de", "xn--mbel-5qa.de"],
    ["MÖBEL.de", "xn--mbel-5qa.de"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeHost(input)).toBe(expected);
  });

  it.each([
    ["", "empty"],
    ["localhost", "single label"],
    ["127.0.0.1", "IPv4"],
    ["127.0.0.1:3000", "IPv4 with port"],
    ["[::1]:3000", "IPv6"],
    ["shop.example.com:abc", "bad port"],
    ["-bad.example.com", "label starts with dash"],
    ["bad_label.example.com", "underscore"],
    ["a.b/c", "path chars"],
    ["user@host.com", "userinfo"],
    [`${"a".repeat(64)}.com`, "label too long"],
  ])("rejects %s (%s)", (input) => {
    expect(normalizeHost(input)).toBeNull();
  });

  it("looseHost keeps single-label hosts for dev aliases", () => {
    expect(looseHost("LocalHost:3000")).toBe("localhost");
    expect(looseHost("127.0.0.1:3000")).toBe("127.0.0.1");
  });
});
