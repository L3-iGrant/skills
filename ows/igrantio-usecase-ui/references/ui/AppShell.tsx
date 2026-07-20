/**
 * Default page frame: <Header/> {children} <Footer/> with the theme applied.
 * Wrap a use-case flow in this to get the iGrant.io look and feel for free.
 */
import "./theme.css";
import type { ReactNode } from "react";
import { Header, type HeaderProps } from "./Header";
import { Footer } from "./Footer";
import { en, type UiStrings } from "./strings";

export interface AppShellProps {
  children: ReactNode;
  strings?: UiStrings;
  /** Header options (languages, currentLang, onLangChange, homeHref). */
  header?: Omit<HeaderProps, "strings">;
}

export function AppShell({ children, strings = en, header }: AppShellProps) {
  return (
    <div className="igr-root">
      <Header strings={strings} {...header} />
      <main className="igr-main">{children}</main>
      <Footer strings={strings} />
    </div>
  );
}
