import * as React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  accentFill?: string;
}

export type IconComponent = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

type IconChildren = React.ReactNode | ((accentFill?: string) => React.ReactNode);

const accentDot = (
  accentFill: string | undefined,
  cx: number,
  cy: number,
  r = 1.2,
) => {
  return accentFill ? (
    <circle cx={cx} cy={cy} r={r} fill={accentFill} stroke="none" />
  ) : null;
};

const createIcon = (displayName: string, children: IconChildren): IconComponent => {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(function IconBase(
    { size = 24, accentFill, className, ...props },
    ref,
  ) {
    const mergedClassName =
      displayName === "IconLoading"
        ? ["animate-spin", className].filter(Boolean).join(" ")
        : className;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={mergedClassName}
        {...props}
      >
        {typeof children === "function" ? children(accentFill) : children}
      </svg>
    );
  });

  Component.displayName = displayName;
  return Component;
};

export const IconCreative = createIcon("IconCreative", (accentFill) => (
  <>
    <path d="M9 14.5c-1.3-1-2.1-2.6-2.1-4.4a5.1 5.1 0 1 1 10.2 0c0 1.8-.8 3.4-2.1 4.4l-.8.6c-.7.5-1.1 1.3-1.1 2.2h-2c0-.9-.4-1.7-1.1-2.2z" />
    <path d="M10 20h4" />
    <path d="M10.7 17h2.6" />
    {accentDot(accentFill, 18.2, 5.8)}
  </>
));

export const IconPlanning = createIcon("IconPlanning", (accentFill) => (
  <>
    <rect x={4} y={4} width={16} height={16} rx={2.5} />
    <path d="M7 8.5h4l2.2 3 3-2.5H17" />
    <path d="M7 14h3l2 2h5" />
    <path d="M7 8.5v0M13.2 11.5v0M16.2 9v0" />
    {accentDot(accentFill, 16.2, 9)}
  </>
));

export const IconWriting = createIcon("IconWriting", (accentFill) => (
  <>
    <path d="M5 18h10" />
    <path d="M5 14.5h7.5" />
    <path d="M13 6.2l4.8 4.8-6.6 6.6-3 .8.8-3z" />
    <path d="M12.2 7l4.8 4.8" />
    {accentDot(accentFill, 6.4, 18.2)}
  </>
));

export const IconReview = createIcon("IconReview", (accentFill) => (
  <>
    <rect x={5} y={4.5} width={10.5} height={14} rx={2} />
    <path d="M8 8h4.5M8 11h4.5M8 14h3.2" />
    <circle cx={16.8} cy={15.6} r={2.6} />
    <path d="m18.6 17.4 2.1 2.1" />
    {accentDot(accentFill, 16.8, 15.6, 0.9)}
  </>
));

export const IconLibrary = createIcon("IconLibrary", (accentFill) => (
  <>
    <path d="M4.5 19.5h15" />
    <rect x={5.5} y={6} width={3.5} height={12} rx={1} />
    <rect x={10.3} y={4.8} width={3.7} height={13.2} rx={1} />
    <path d="M15.5 8.2l3 9.8" />
    <path d="M16.8 6.2 20 16.4" />
    {accentDot(accentFill, 12.2, 7.1)}
  </>
));

export const IconStats = createIcon("IconStats", (accentFill) => (
  <>
    <path d="M5 18.5h14" />
    <path d="M7 18.5v-4.5" />
    <path d="M11 18.5v-7" />
    <path d="M15 18.5v-5.5" />
    <path d="M19 18.5v-9" />
    <path d="m6.8 9.8 2.5-2.1 2.7 1.6 2.3-2.2 2.9 1" />
    {accentDot(accentFill, 19, 9.5)}
  </>
));

export const IconSettings = createIcon("IconSettings", (accentFill) => (
  <>
    <circle cx={12} cy={12} r={3.4} />
    <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2" />
    <path d="m6.7 6.7 1.4 1.4M15.9 15.9l1.4 1.4M17.3 6.7l-1.4 1.4M8.1 15.9l-1.4 1.4" />
    {accentDot(accentFill, 12, 12, 1.05)}
  </>
));

export const IconShelf = createIcon("IconShelf", (accentFill) => (
  <>
    <path d="M4.5 19.5h15M4.5 7h15" />
    <rect x={6} y={8.2} width={3} height={10} rx={0.8} />
    <rect x={10.5} y={9.4} width={3} height={8.8} rx={0.8} />
    <rect x={15} y={8.8} width={2.8} height={9.4} rx={0.8} />
    {accentDot(accentFill, 17.8, 8.8, 0.8)}
  </>
));

export const IconFeather = createIcon("IconFeather", (accentFill) => (
  <>
    <path d="M19 5c-5.6.4-10.3 5.1-10.7 10.7-.1 1.3-.9 2.4-2 3.2L4 20l1.1-2.3c.8-1.1 1.9-1.9 3.2-2C13.9 15.3 18.6 10.6 19 5z" />
    <path d="M8.2 15.8 14 10" />
    <path d="M10.4 13.6l1.8 1.8" />
    {accentDot(accentFill, 18.2, 5.8, 0.9)}
  </>
));

/** 顶栏品牌标：Writer 首字母 W */
export const IconBrandLogo = createIcon("IconBrandLogo", () => (
  <>
    <path
      d="M5.5 8 8.4 16.8 12 10.6 15.6 16.8 18.5 8"
      strokeWidth={2.35}
    />
  </>
));

export const IconPlus = createIcon("IconPlus", (accentFill) => (
  <>
    <path d="M12 5.5v13" />
    <path d="M5.5 12h13" />
    {accentDot(accentFill, 18.5, 5.5)}
  </>
));

export const IconClose = createIcon("IconClose", (accentFill) => (
  <>
    <path d="m6 6 12 12M18 6 6 18" />
    {accentDot(accentFill, 12, 12, 0.95)}
  </>
));

export const IconArrowLeft = createIcon("IconArrowLeft", (accentFill) => (
  <>
    <path d="M19 12H7.5" />
    <path d="m11 7.5-4.5 4.5 4.5 4.5" />
    <path d="M7.5 12c0-3 1.5-5.5 4-7" />
    {accentDot(accentFill, 6.5, 12, 0.9)}
  </>
));

export const IconArrowRight = createIcon("IconArrowRight", (accentFill) => (
  <>
    <path d="M5 12h11.5" />
    <path d="m13 7.5 4.5 4.5-4.5 4.5" />
    <path d="M16.5 12c0-3-1.5-5.5-4-7" />
    {accentDot(accentFill, 17.5, 12, 0.9)}
  </>
));

export const IconArrowUp = createIcon("IconArrowUp", (accentFill) => (
  <>
    <path d="M12 19V7.5" />
    <path d="m7.5 11 4.5-4.5 4.5 4.5" />
    <path d="M12 7.5c3 0 5.5 1.5 7 4" />
    {accentDot(accentFill, 12, 6.5, 0.9)}
  </>
));

export const IconArrowDown = createIcon("IconArrowDown", (accentFill) => (
  <>
    <path d="M12 5v11.5" />
    <path d="m7.5 13 4.5 4.5 4.5-4.5" />
    <path d="M12 16.5c-3 0-5.5-1.5-7-4" />
    {accentDot(accentFill, 12, 17.5, 0.9)}
  </>
));

export const IconSave = createIcon("IconSave", (accentFill) => (
  <>
    <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h9.3L19 8.2v10.3a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5z" />
    <path d="M8 5v4.2h6V5" />
    <path d="M8.2 14.2h7.6" />
    {accentDot(accentFill, 15.8, 7.4, 0.9)}
  </>
));

export const IconEdit = createIcon("IconEdit", (accentFill) => (
  <>
    <path d="M4.8 19.2h14.4" />
    <path d="M14.4 5.5 18.5 9.6 9.2 18.9 5 20l1.1-4.2z" />
    <path d="m13.2 6.7 4.1 4.1" />
    {accentDot(accentFill, 18.5, 9.6, 0.85)}
  </>
));

export const IconDelete = createIcon("IconDelete", (accentFill) => (
  <>
    <path d="M6 7.5h12" />
    <path d="M8 7.5v11a1.5 1.5 0 0 0 1.5 1.5h5a1.5 1.5 0 0 0 1.5-1.5v-11" />
    <path d="M9.2 7.5V6.2a1.2 1.2 0 0 1 1.2-1.2h3.2a1.2 1.2 0 0 1 1.2 1.2v1.3" />
    <path d="M10.5 10.5v6M13.5 10.5v6" />
    {accentDot(accentFill, 12, 5, 0.85)}
  </>
));

export const IconSearch = createIcon("IconSearch", (accentFill) => (
  <>
    <circle cx={11} cy={11} r={5.2} />
    <path d="m15 15 4.2 4.2" />
    {accentDot(accentFill, 13.8, 8.4, 0.85)}
  </>
));

export const IconUser = createIcon("IconUser", (accentFill) => (
  <>
    <circle cx={12} cy={8.3} r={3.2} />
    <path d="M5.5 18c1.7-3.3 4-4.9 6.5-4.9s4.8 1.6 6.5 4.9" />
    {accentDot(accentFill, 15.5, 7.2, 0.8)}
  </>
));

export const IconFile = createIcon("IconFile", (accentFill) => (
  <>
    <path d="M7 4.5h7l4 4v11a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5V6a1.5 1.5 0 0 1 1-1.5z" />
    <path d="M14 4.5v4h4" />
    <path d="M8.5 13h7M8.5 16h5.5" />
    {accentDot(accentFill, 16.3, 8.3, 0.8)}
  </>
));

export const IconEye = createIcon("IconEye", (accentFill) => (
  <>
    <path d="M2.8 12c2.1-3.5 5.5-5.3 9.2-5.3s7.1 1.8 9.2 5.3c-2.1 3.5-5.5 5.3-9.2 5.3S4.9 15.5 2.8 12z" />
    <circle cx={12} cy={12} r={2.5} />
    {accentDot(accentFill, 12.9, 11.1, 0.65)}
  </>
));

export const IconEyeOff = createIcon("IconEyeOff", (accentFill) => (
  <>
    <path d="M4.1 4.1 19.9 19.9" />
    <path d="M2.8 12c2.1-3.5 5.5-5.3 9.2-5.3 1.7 0 3.3.4 4.8 1.2" />
    <path d="M21.2 12c-2.1 3.5-5.5 5.3-9.2 5.3-1.7 0-3.3-.4-4.8-1.2" />
    <path d="M10.2 10.2a2.5 2.5 0 0 0 3.6 3.6" />
    {accentDot(accentFill, 16.8, 8.1, 0.75)}
  </>
));

export const IconDownload = createIcon("IconDownload", (accentFill) => (
  <>
    <path d="M12 4.8v9.5" />
    <path d="m8.4 11.5 3.6 3.6 3.6-3.6" />
    <path d="M5 18.5h14" />
    {accentDot(accentFill, 12, 15.1, 0.85)}
  </>
));

export const IconUpload = createIcon("IconUpload", (accentFill) => (
  <>
    <path d="M12 19.2V9.7" />
    <path d="m8.4 12.5 3.6-3.6 3.6 3.6" />
    <path d="M5 5.5h14" />
    {accentDot(accentFill, 12, 8.9, 0.85)}
  </>
));

export const IconCheck = createIcon("IconCheck", (accentFill) => (
  <>
    <path d="m5.2 12.6 4.2 4.1L19 7.3" />
    {accentDot(accentFill, 9.4, 16.6, 0.8)}
  </>
));

export const IconCheckCheck = createIcon("IconCheckCheck", (accentFill) => (
  <>
    <path d="m2.8 12.6 3.2 3.1 3.2-3.1" />
    <path d="m8.4 12.6 4.2 4.1L22 7.3" />
    <path d="m10.4 10.2 2.2-2.2" />
    {accentDot(accentFill, 12.6, 16.8, 0.8)}
  </>
));

export const IconAlert = createIcon("IconAlert", (accentFill) => (
  <>
    <path d="M11.2 4.8 3.7 17.9A1.5 1.5 0 0 0 5 20h14a1.5 1.5 0 0 0 1.3-2.1L12.8 4.8a1 1 0 0 0-1.6 0z" />
    <path d="M12 9v4.8M12 17.2v.1" />
    {accentDot(accentFill, 12, 17.2, 0.75)}
  </>
));

export const IconInfo = createIcon("IconInfo", (accentFill) => (
  <>
    <circle cx={12} cy={12} r={8} />
    <path d="M12 10.2v5.3" />
    <path d="M12 7.3v.1" />
    {accentDot(accentFill, 12, 7.4, 0.75)}
  </>
));

export const IconHome = createIcon("IconHome", (accentFill) => (
  <>
    <path d="m3.8 10.5 8.2-6.2 8.2 6.2" />
    <path d="M6.2 9.8v9.2h11.6V9.8" />
    <path d="M10 19v-4.5h4V19" />
    {accentDot(accentFill, 12, 7.2, 0.8)}
  </>
));

export const IconSparkles = createIcon("IconSparkles", (accentFill) => (
  <>
    <path d="M12 4.5 13.4 8 17 9.4l-3.6 1.4L12 14.5l-1.4-3.7L7 9.4 10.6 8z" />
    <path d="M5 5.5 5.7 7.2 7.4 8 5.7 8.8 5 10.5 4.3 8.8 2.6 8l1.7-.8z" />
    <path d="M19 13.5 19.6 15 21 15.6 19.6 16.2 19 17.8 18.4 16.2 17 15.6 18.4 15z" />
    {accentDot(accentFill, 12, 9.4, 0.85)}
  </>
));

export const IconBot = createIcon("IconBot", (accentFill) => (
  <>
    <rect x={5.2} y={7} width={13.6} height={11} rx={3} />
    <path d="M12 4.2v2.8M8.8 12h.1M15.1 12h.1M9 15h6" />
    <path d="M3.8 11.5h1.4M18.8 11.5h1.4" />
    {accentDot(accentFill, 15.2, 12, 0.7)}
  </>
));

export const IconLoading = createIcon("IconLoading", (accentFill) => (
  <>
    <path d="M20 12a8 8 0 1 1-8-8" />
    <path d="M20 12a8 8 0 0 0-3.4-6.5" />
    {accentDot(accentFill, 18.7, 8.3, 0.95)}
  </>
));

export const IconMenu = createIcon("IconMenu", (accentFill) => (
  <>
    <path d="M5 7.5h14M5 12h14M5 16.5h14" />
    {accentDot(accentFill, 6.5, 12, 0.75)}
  </>
));

export const IconFolder = createIcon("IconFolder", (accentFill) => (
  <>
    <path d="M4.5 8.5h5l1.7 1.8h8.3a1.5 1.5 0 0 1 1.5 1.5v6.7a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-8.5A1.5 1.5 0 0 1 4.5 8.5z" />
    <path d="M3.8 10.8h16.4" />
    {accentDot(accentFill, 9.8, 9, 0.75)}
  </>
));

export const IconCalendar = createIcon("IconCalendar", (accentFill) => (
  <>
    <rect x={4.5} y={5.8} width={15} height={14.2} rx={2} />
    <path d="M8 4.5v2.6M16 4.5v2.6M4.5 9.8h15" />
    <path d="M8.5 13.2h2.5M13 13.2h2.5M8.5 16.5H11" />
    {accentDot(accentFill, 15.5, 16.5, 0.8)}
  </>
));

export const IconDrag = createIcon("IconDrag", (accentFill) => (
  <>
    <circle cx={9} cy={7} r={0.9} />
    <circle cx={15} cy={7} r={0.9} />
    <circle cx={9} cy={12} r={0.9} />
    <circle cx={15} cy={12} r={0.9} />
    <circle cx={9} cy={17} r={0.9} />
    <circle cx={15} cy={17} r={0.9} />
    {accentDot(accentFill, 15, 12, 0.9)}
  </>
));

export const IconBookOpen = createIcon("IconBookOpen", (accentFill) => (
  <>
    <path d="M4.8 6.8c2.6-.9 5.1-.8 7.2.4v12.4c-2.1-1.2-4.6-1.3-7.2-.4z" />
    <path d="M19.2 6.8c-2.6-.9-5.1-.8-7.2.4v12.4c2.1-1.2 4.6-1.3 7.2-.4z" />
    <path d="M12 7.2v12.4" />
    {accentDot(accentFill, 17.6, 8.4, 0.8)}
  </>
));

export const IconTag = createIcon("IconTag", (accentFill) => (
  <>
    <path d="M10.5 4.5H5.2A1.2 1.2 0 0 0 4 5.7V11l7.5 7.5a1.5 1.5 0 0 0 2.1 0l4.9-4.9a1.5 1.5 0 0 0 0-2.1z" />
    <circle cx={7.5} cy={7.5} r={1} />
    {accentDot(accentFill, 7.5, 7.5, 0.7)}
  </>
));

export const IconList = createIcon("IconList", (accentFill) => (
  <>
    <path d="M9 7h10M9 12h10M9 17h10" />
    <circle cx={5.5} cy={7} r={0.8} />
    <circle cx={5.5} cy={12} r={0.8} />
    <circle cx={5.5} cy={17} r={0.8} />
    {accentDot(accentFill, 5.5, 12, 0.8)}
  </>
));

export const IconGrid = createIcon("IconGrid", (accentFill) => (
  <>
    <rect x={4.5} y={4.5} width={6.5} height={6.5} rx={1.2} />
    <rect x={13} y={4.5} width={6.5} height={6.5} rx={1.2} />
    <rect x={4.5} y={13} width={6.5} height={6.5} rx={1.2} />
    <rect x={13} y={13} width={6.5} height={6.5} rx={1.2} />
    {accentDot(accentFill, 16.2, 7.8, 0.8)}
  </>
));

export const IconMoveRight = createIcon("IconMoveRight", (accentFill) => (
  <>
    <path d="M4.5 12h13.2" />
    <path d="m14.3 8.5 3.7 3.5-3.7 3.5" />
    <path d="M7 9.3V14.7" />
    {accentDot(accentFill, 18.1, 12, 0.8)}
  </>
));

export const IconPenTool = createIcon("IconPenTool", (accentFill) => (
  <>
    <path d="M12 4.6 8.1 8.5 12 12.4l3.9-3.9z" />
    <path d="M8.1 8.5 6 14.4l6 5 6-5-2.1-5.9" />
    <path d="M12 12.4V19.4" />
    {accentDot(accentFill, 12, 4.6, 0.85)}
  </>
));

export const IconSend = createIcon("IconSend", (accentFill) => (
  <>
    <path d="M4 11.5 20 4.5l-4.8 15L11.2 13l-7.2-1.5z" />
    <path d="M11.2 13 20 4.5" />
    {accentDot(accentFill, 15.1, 18.4, 0.8)}
  </>
));

export const IconRefresh = createIcon("IconRefresh", (accentFill) => (
  <>
    <path d="M18.5 9.8A6.9 6.9 0 0 0 6.9 7.7L5.5 9.2" />
    <path d="M5.5 5.5v3.7h3.7" />
    <path d="M5.5 14.2a6.9 6.9 0 0 0 11.6 2.1l1.4-1.5" />
    <path d="M18.5 18.5v-3.7h-3.7" />
    {accentDot(accentFill, 18.5, 9.2, 0.8)}
  </>
));

export const IconStar = createIcon("IconStar", (accentFill) => (
  <>
    <path d="m12 4.5 2.3 4.8 5.2.8-3.7 3.7.9 5.2-4.7-2.5-4.7 2.5.9-5.2-3.7-3.7 5.2-.8z" />
    {accentDot(accentFill, 12, 9.3, 0.8)}
  </>
));

export const IconCopy = createIcon("IconCopy", (accentFill) => (
  <>
    <rect x={8} y={8} width={10.5} height={12} rx={1.8} />
    <path d="M6.5 16H5.8A1.8 1.8 0 0 1 4 14.2V5.8A1.8 1.8 0 0 1 5.8 4h8.4A1.8 1.8 0 0 1 16 5.8v.7" />
    {accentDot(accentFill, 16.3, 10.2, 0.75)}
  </>
));

export const IconExternalLink = createIcon("IconExternalLink", (accentFill) => (
  <>
    <path d="M14.5 4.5H19.5V9.5" />
    <path d="M10 14 19.5 4.5" />
    <path d="M18.5 13.5v5A1.5 1.5 0 0 1 17 20H5.5A1.5 1.5 0 0 1 4 18.5V7A1.5 1.5 0 0 1 5.5 5.5h5" />
    {accentDot(accentFill, 19.1, 4.9, 0.75)}
  </>
));

export const IconMaximize = createIcon("IconMaximize", (accentFill) => (
  <>
    <path d="M8.5 4.8H4.8v3.7M15.5 4.8h3.7v3.7M8.5 19.2H4.8v-3.7M15.5 19.2h3.7v-3.7" />
    <path d="m9.8 9.8-5-5M14.2 9.8l5-5M9.8 14.2l-5 5M14.2 14.2l5 5" />
    {accentDot(accentFill, 19.2, 4.8, 0.7)}
  </>
));

export const IconMinimize = createIcon("IconMinimize", (accentFill) => (
  <>
    <path d="M4.8 8.5h3.7V4.8M19.2 8.5h-3.7V4.8M4.8 15.5h3.7v3.7M19.2 15.5h-3.7v3.7" />
    <path d="m9.8 9.8-5 5M14.2 9.8l5 5M9.8 14.2l-5-5M14.2 14.2l5-5" />
    {accentDot(accentFill, 4.8, 8.5, 0.7)}
  </>
));

export const IconPalette = createIcon("IconPalette", (accentFill) => (
  <>
    <path d="M12 4.5c-4.5 0-8.2 3.3-8.2 7.4 0 3.6 2.9 6.6 6.4 6.6h1.1c1 0 1.8-.8 1.8-1.8 0-.8-.3-1.4-.3-2 0-1 .8-1.8 1.8-1.8h1.5c2.2 0 4.1-1.8 4.1-4 0-2.6-1.8-4.4-4.5-4.4z" />
    <circle cx={8.2} cy={10} r={0.9} />
    <circle cx={11.1} cy={8.6} r={0.9} />
    <circle cx={14.1} cy={9.6} r={0.9} />
    {accentDot(accentFill, 8.2, 10, 0.9)}
  </>
));

export const IconCheckCircle = createIcon("IconCheckCircle", (accentFill) => (
  <>
    <circle cx={12} cy={12} r={8.2} />
    <path d="m8.2 12.3 2.8 2.8 4.8-5.1" />
    {accentDot(accentFill, 11.1, 15.1, 0.75)}
  </>
));

export const IconLock = createIcon("IconLock", (accentFill) => (
  <>
    <rect x={5.5} y={10.2} width={13} height={9} rx={2} />
    <path d="M8.5 10.2V8.4a3.5 3.5 0 0 1 7 0v1.8" />
    <path d="M12 14.1v2.7" />
    {accentDot(accentFill, 12, 14.1, 0.7)}
  </>
));
