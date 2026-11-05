import { Manrope, Nunito } from "next/font/google";

export const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

/** Logo only (Nunito Black 900). */
export const nunito = Nunito({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-nunito",
  display: "swap",
});
