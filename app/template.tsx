"use client";

import { usePathname } from "next/navigation";

/**
 * Route transition wrapper.
 *
 * A template re-renders on every navigation, but Next.js keys it by the
 * child *segment* — so navigating between sibling subpages under the same
 * parent segment (e.g. /admin/audit-trail → /admin/users) does NOT remount
 * the template, and the entrance animation never restarts.
 *
 * key={pathname} forces React to unmount/remount the wrapper on every route
 * change, which restarts the CSS animation regardless of segment sharing —
 * covering hard refresh AND client-side link navigation everywhere.
 *
 * Per-page animations (animate-shield, animate-icon-bounce, etc.) are
 * untouched — they keep running on their own elements inside each page.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-enter">
      {children}
    </div>
  );
}
