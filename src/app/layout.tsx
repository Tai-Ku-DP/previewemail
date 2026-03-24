import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <title>PreviewMail</title>
      </head>
      <body suppressHydrationWarning>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
