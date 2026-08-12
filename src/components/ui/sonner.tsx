import { useEffect, useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [isMobile, setIsMobile] = useState(() =>
    window.matchMedia("(max-width: 639px)").matches
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)")
    const updateIsMobile = () => setIsMobile(mediaQuery.matches)

    mediaQuery.addEventListener("change", updateIsMobile)

    return () => mediaQuery.removeEventListener("change", updateIsMobile)
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={isMobile ? "top-center" : "bottom-center"}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          ...(isMobile
            ? {
                left: "50%",
                right: "auto",
                transform: "translateX(-50%)",
                width: "calc(100% - 2rem)",
              }
            : {}),
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !left-0 !right-0 !mx-auto !w-fit !min-w-0 !max-w-[calc(100vw-2rem)] !justify-center !gap-2 !px-4 !py-3",
          title: "!text-sm !font-medium",
          description: "!text-sm",
          content: "!flex-none",
          icon: "!m-0 !size-4 [&>svg]:!m-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
