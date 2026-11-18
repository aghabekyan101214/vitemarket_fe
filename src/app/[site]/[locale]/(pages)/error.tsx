"use client";
/** Cold-render failure (inside the site layout, so theme and fonts stay). */
import { useEffect } from "react";
import { useSite } from "@/components/common/SiteProvider";
import { StatusPage } from "@/components/common/StatusPage";
import { buttonClass } from "@/components/common/styles";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { siteName, homeHref, messages } = useSite();
  useEffect(() => {
    console.error("[page] render failed", { digest: error.digest });
  }, [error]);
  return (
    <StatusPage
      siteName={siteName}
      homeHref={homeHref}
      title={messages.errorTitle}
      body={messages.errorBody}
      action={
        <button type="button" onClick={() => retry()} className={buttonClass}>
          {messages.retry}
        </button>
      }
    />
  );
}
