import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "RenewMargin", description: "Maintenance agreement profitability and repricing for service contractors." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
