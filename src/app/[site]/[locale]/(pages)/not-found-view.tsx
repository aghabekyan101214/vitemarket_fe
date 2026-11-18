"use client";
import Link from "next/link";
import { useSite } from "@/components/common/SiteProvider";
import { StatusPage } from "@/components/common/StatusPage";
import { buttonClass } from "@/components/common/styles";

export function NotFoundView() {
  const { siteName, homeHref, messages } = useSite();
  return (
    <StatusPage
      siteName={siteName}
      homeHref={homeHref}
      title={messages.notFoundTitle}
      body={messages.notFoundBody}
      action={
        <Link href={homeHref} className={buttonClass}>
          {messages.backHome}
        </Link>
      }
    />
  );
}
