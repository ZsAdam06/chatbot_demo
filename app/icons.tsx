import type { SVGProps } from "react";

// Egységes, 1.75-ös vonalvastagságú ikonkészlet (24×24 rács).
function Svg({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

export const IconSpark = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M12 3.5c.5 4.3 2.7 6.5 7 7-4.3.5-6.5 2.7-7 7-.5-4.3-2.7-6.5-7-7 4.3-.5 6.5-2.7 7-7Z" /><path d="M19 3v3M17.5 4.5h3" /></Svg>
);
export const IconBook = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M12 6.5C10.3 5.2 8 4.5 4 4.5v14c4 0 6.3.7 8 2 1.7-1.3 4-2 8-2v-14c-4 0-6.3.7-8 2Z" /><path d="M12 6.5v14" /></Svg>
);
export const IconFile = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8Z" /><path d="M14 3.5V8h4.5M9 12.5h6M9 16h4" /></Svg>
);
export const IconSend = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.2 2.4 2.3 4.6-4.9" /></Svg>
);
export const IconAlert = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M10.3 4.2 3 17a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9.5v4M12 16.8v.2" /></Svg>
);
export const IconSlash = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="m6.5 17.5 11-11" /></Svg>
);
export const IconChevron = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>
);
export const IconBack = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>
);
export const IconArrow = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);
