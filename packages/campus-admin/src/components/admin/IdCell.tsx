/**
 * IdCell - displays a long UUID-style identifier in a compact, elegant form.
 * Truncates to "prefix…suffix", shows the full value in a tooltip, and
 * offers a one-click copy button with transient success feedback.
 */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IdCellProps {
  id: string;
  /** Characters kept at the start of the truncated value (default 8) */
  prefixLength?: number;
  /** Characters kept at the end of the truncated value (default 6) */
  suffixLength?: number;
}

export function IdCell({ id, prefixLength = 8, suffixLength = 6 }: IdCellProps) {
  const [copied, setCopied] = useState(false);

  const isTruncated = id.length > prefixLength + suffixLength + 1;
  const displayValue = isTruncated
    ? `${id.slice(0, prefixLength)}…${id.slice(-suffixLength)}`
    : id;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable; silently ignore.
    }
  };

  return (
    <div className="group/id flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default truncate">{displayValue}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="font-mono text-xs">
          {id}
        </TooltipContent>
      </Tooltip>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy ID to clipboard"
        className="shrink-0 rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none group-hover/id:opacity-100"
      >
        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      </button>
    </div>
  );
}
