"use client";
/**
 * The little site context client boundaries need (error.tsx and not-found have no params).
 * Server components get the same data as props from `getSite()`.
 */
import { createContext, type ReactNode, useContext } from "react";
import type { Messages } from "@/lib/i18n/t";
import en from "@/lib/i18n/messages/en";

export interface ClientSite {
  locale: string;
  lang: string;
  siteName: string;
  homeHref: string;
  messages: Messages;
}

const SiteCtx = createContext<ClientSite>({ locale: "en", lang: "en", siteName: "", homeHref: "/", messages: en });

export function SiteProvider({ value, children }: { value: ClientSite; children: ReactNode }) {
  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export function useSite(): ClientSite {
  return useContext(SiteCtx);
}
