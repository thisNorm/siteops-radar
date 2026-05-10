"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function LockedPreview({
  children,
  locked,
  signInPath,
  title,
  description,
}: {
  children: ReactNode;
  locked: boolean;
  signInPath: string;
  title: string;
  description: string;
}) {
  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-[6px] saturate-75">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-background/45 px-6 text-center backdrop-blur-sm">
        <div className="max-w-sm space-y-3">
          <div className="text-base font-semibold">{title}</div>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          <a href={signInPath}>
            <Button className="rounded-2xl">{title}</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
