'use client';

import { ReactNode, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: ReactNode;
  /** Plain text of the title, for the labels a screen reader reads. */
  titleLabel: string;
  /** Sits beside the title, like the playlist count. */
  badge?: ReactNode;
  /** Controls for the section. On the title's row, and only while it is open. */
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

function Chevron({
  open,
  label,
  onClick,
  className,
}: {
  open: boolean;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
      className={`cursor-pointer p-1 text-fg/30 transition-colors hover:text-fg/70 ${className ?? ''}`}
    >
      <ChevronDown
        aria-hidden
        className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
          open ? '' : '-rotate-90'
        }`}
      />
    </button>
  );
}

export function CollapsibleSection({
  title,
  titleLabel,
  badge,
  actions,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  const toggle = () => setOpen(!open);

  return (
    <section className="overflow-hidden rounded-2xl border border-fg/10">
      {/* The fill stops at the header: behind the cards it would tint them,
          and a card that changes shade on expand reads as a bug. */}
      <div className="bg-fg/[0.03] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* The chevron rides with the title on a phone and with the controls
              on a wider screen, so the title never has to share its line. */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={contentId}
              className="group flex cursor-pointer items-baseline gap-2 text-left sm:gap-3"
            >
              <span className="text-xl font-black tracking-tighter text-fg transition-colors group-hover:text-spotify-green sm:text-3xl">
                {title}
              </span>
              {badge}
            </button>

            <Chevron
              open={open}
              label={titleLabel}
              onClick={toggle}
              className="sm:hidden"
            />
          </div>

          {open && actions ? (
            <div className="flex items-center gap-3">
              {actions}
              <Chevron
                open={open}
                label={titleLabel}
                onClick={toggle}
                className="hidden sm:inline-flex"
              />
            </div>
          ) : (
            <Chevron
              open={open}
              label={titleLabel}
              onClick={toggle}
              className="hidden sm:inline-flex"
            />
          )}
        </div>
      </div>

      {/* Grid rows rather than an animated height: `auto` is not a length, so
          animating to it means measuring first. */}
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        {/* min-h-0 or the row will not shrink below its content. */}
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-5 sm:px-6 sm:pb-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
