import React from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight">
          {Icon && <Icon className="h-8 w-8 text-primary" />}
          {title}
        </h1>
        {actions && <div>{actions}</div>}
      </div>
      {description && (
        <p className="text-muted-foreground text-lg max-w-2xl">{description}</p>
      )}
    </header>
  );
}
