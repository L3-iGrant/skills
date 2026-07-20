/**
 * Small styled building blocks for use-case flows. Each is a thin wrapper over a
 * class in theme.css; nothing beyond these. Keep the sprawl out.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* Split layout ---------------------------------------------------------- */
/** usecase-sdk SplitLayout: sticky stepper sidebar (4fr) + main column (8fr). */
export function SplitLayout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="igr-layout">
      <aside className="igr-sidebar">{sidebar}</aside>
      <div className="igr-content">{children}</div>
    </div>
  );
}

/* Stepper -------------------------------------------------------------- */
export function Stepper({ children }: { children: ReactNode }) {
  return <ol className="stepper">{children}</ol>;
}

export interface StepProps {
  title: ReactNode;
  detail?: ReactNode;
  /** 1-based number shown in the iGrant.io offset-shadow number box. */
  number?: number;
  done?: boolean;
  active?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

/** usecase-sdk StepIndicator: a white card with the number box, a Byrd
 *  title, and a dark-green tick circle once done. */
export function Step({ title, detail, number, done, active, onClick, children }: StepProps) {
  return (
    <li className={cx("step", done && "done", active && "active")} onClick={onClick}>
      <div className="step-content">
        <div className="step-header">
          {number != null && (
            <span className="step-number" aria-hidden="true">
              <span>{number}</span>
            </span>
          )}
          <p className="step-title">{title}</p>
          {done && (
            <span className="step-tick" aria-label="Completed">
              ✓
            </span>
          )}
        </div>
        {detail ? <p className={cx("step-detail", number != null && "with-number")}>{detail}</p> : null}
        {children}
      </div>
    </li>
  );
}

/* Content card ---------------------------------------------------------- */
/** usecase-sdk ContentCard: the step's main column, content capped at 800px. */
export function ContentCard({ children }: { children: ReactNode }) {
  return (
    <section className="content-card">
      <div className="content-wrapper">{children}</div>
    </section>
  );
}

/* Step navigation -------------------------------------------------------- */
export function StepNav({ back, next }: { back?: ReactNode; next?: ReactNode }) {
  return (
    <div className="step-nav">
      <div>{back}</div>
      <div>{next}</div>
    </div>
  );
}

/* Panel ---------------------------------------------------------------- */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("panel", className)}>{children}</div>;
}

/* Field ---------------------------------------------------------------- */
export interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

/* Button --------------------------------------------------------------- */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** "secondary" (default): white, light border. "primary": black. "ghost": borderless. */
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ variant = "secondary", className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("btn", variant === "primary" && "primary", variant === "ghost" && "ghost", className)}
      {...rest}
    />
  );
}

/* QR box --------------------------------------------------------------- */
export function QrBox({ children }: { children: ReactNode }) {
  return <div className="qr-box">{children}</div>;
}

/* Status stage --------------------------------------------------------- */
export interface StatusStageProps {
  /** Content, left-aligned. */
  children: ReactNode;
  /** Action buttons, right-aligned. */
  actions?: ReactNode;
  tone?: "default" | "success" | "error";
}

export function StatusStage({ children, actions, tone = "default" }: StatusStageProps) {
  return (
    <div className={cx("status-stage", tone !== "default" && tone)}>
      <div className="status-content">{children}</div>
      {actions ? <div className="status-actions">{actions}</div> : null}
    </div>
  );
}
