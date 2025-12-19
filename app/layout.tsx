import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AlertProvider } from "@/components/alert-provider";

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Escala Mídia - Sétima Pomba",
  description: "Sistema de escala da equipe de mídia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${poppins.className} antialiased`}
      >
        <AlertProvider>
          {children}
        </AlertProvider>
      </body>
    </html>
  );
}
