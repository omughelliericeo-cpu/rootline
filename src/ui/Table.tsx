// Data tables for producer lists: a card with a sand header row and thin row
// lines. Scrolls sideways on a narrow phone instead of squashing columns.
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

export function Table({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded border border-line bg-card">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...rest }: ComponentProps<"th">) {
  return <th scope="col" className={cx("bg-sand px-4 py-3 text-xs font-medium text-muted", className)} {...rest} />;
}

export function Td({ className, ...rest }: ComponentProps<"td">) {
  return <td className={cx("border-t border-line px-4 py-3 align-middle", className)} {...rest} />;
}
