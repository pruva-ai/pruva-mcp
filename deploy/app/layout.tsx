import type { ReactNode } from "react";

export const metadata = {
  title: "Pruva MCP",
  description: "Remote MCP server for Pruva",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
