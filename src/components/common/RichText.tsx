/**
 * HTML already sanitized by the backend (`nh3`, the trust boundary). Rendered as is with
 * prose styles from globals.css.
 */
export function RichText({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
