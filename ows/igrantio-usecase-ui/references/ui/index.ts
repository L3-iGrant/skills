/**
 * iGrant.io use-case UI: the default look and feel for iGrant.io frontends.
 * Theme, shell, a few primitives, and strings-driven i18n. Nothing more.
 */
export { AppShell, type AppShellProps } from "./AppShell";
export { Header, type HeaderProps, type Language } from "./Header";
export { Footer, type FooterProps } from "./Footer";
export {
  SplitLayout,
  Stepper,
  Step,
  type StepProps,
  ContentCard,
  StepNav,
  Panel,
  Field,
  type FieldProps,
  Button,
  type ButtonProps,
  QrBox,
  StatusStage,
  type StatusStageProps,
} from "./primitives";
export {
  en,
  formatCopyright,
  type UiStrings,
  type FooterStrings,
  type NavLink,
  type SocialLink,
  type SocialPlatform,
} from "./strings";
