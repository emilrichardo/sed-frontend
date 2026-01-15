"use client";

import React, { useState, useRef, useEffect } from "react";

export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "blockquote"
  | "ul"
  | "ol"
  | "check"
  | "upload"
  | "hr";

interface BlockSelectorProps {
  onSelect: (type: BlockType) => void;
  triggerImageUpload: () => void;
}

export const BlockSelector: React.FC<BlockSelectorProps> = ({
  onSelect,
  triggerImageUpload,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (type: BlockType) => {
    if (type === "upload") {
      triggerImageUpload();
    } else {
      onSelect(type);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-all shadow-sm border border-border/50 text-sm font-medium"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Agregar Bloque
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-80 overflow-y-auto py-2">
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Texto
            </div>
            <MenuItem
              onClick={() => handleSelect("paragraph")}
              icon={<ParagraphIcon />}
              label="Paragraph"
            />
            <MenuItem
              onClick={() => handleSelect("blockquote")}
              icon={<QuoteIcon />}
              label="Blockquote"
            />

            <div className="my-1 border-t border-border/50" />
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Headings
            </div>
            <MenuItem
              onClick={() => handleSelect("h1")}
              icon={<H1Icon />}
              label="Heading 1"
            />
            <MenuItem
              onClick={() => handleSelect("h2")}
              icon={<H2Icon />}
              label="Heading 2"
            />
            <MenuItem
              onClick={() => handleSelect("h3")}
              icon={<H3Icon />}
              label="Heading 3"
            />
            <MenuItem
              onClick={() => handleSelect("h4")}
              icon={<H4Icon />}
              label="Heading 4"
            />
            <MenuItem
              onClick={() => handleSelect("h5")}
              icon={<H5Icon />}
              label="Heading 5"
            />
            <MenuItem
              onClick={() => handleSelect("h6")}
              icon={<H6Icon />}
              label="Heading 6"
            />

            <div className="my-1 border-t border-border/50" />
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Listas
            </div>
            <MenuItem
              onClick={() => handleSelect("ul")}
              icon={<UlIcon />}
              label="Unordered List"
            />
            <MenuItem
              onClick={() => handleSelect("ol")}
              icon={<OlIcon />}
              label="Ordered List"
            />
            <MenuItem
              onClick={() => handleSelect("check")}
              icon={<CheckIcon />}
              label="Check List"
            />

            <div className="my-1 border-t border-border/50" />
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Media
            </div>
            <MenuItem
              onClick={() => handleSelect("upload")}
              icon={<UploadIcon />}
              label="Upload"
            />

            <div className="my-1 border-t border-border/50" />
            <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Basic
            </div>
            <MenuItem
              onClick={() => handleSelect("hr")}
              icon={<HrIcon />}
              label="Horizontal Rule"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const MenuItem = ({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
  >
    <div className="text-muted-foreground">{icon}</div>
    {label}
  </button>
);

// Icons
const ParagraphIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h7"
    />
  </svg>
);
const QuoteIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
    />
  </svg>
);
const H1Icon = () => <span className="font-bold text-xs">H1</span>;
const H2Icon = () => <span className="font-bold text-xs">H2</span>;
const H3Icon = () => <span className="font-bold text-xs">H3</span>;
const H4Icon = () => <span className="font-bold text-xs">H4</span>;
const H5Icon = () => <span className="font-bold text-xs">H5</span>;
const H6Icon = () => <span className="font-bold text-xs">H6</span>;
const UlIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);
const OlIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 7h12M7 12h12M7 17h12M3 7h.01M3 12h.01M3 17h.01"
    />
  </svg>
);
const CheckIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const UploadIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const HrIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 12H4"
    />
  </svg>
);
