/**
 * Small styled building blocks for use-case flows. Each is a thin wrapper over a
 * class in theme.css; nothing beyond these. Keep the sprawl out.
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* Stepper -------------------------------------------------------------- */
export function Stepper({ children }: { children: ReactNode }) {
  return <ol className="stepper">{children}</ol>;
}

export interface StepProps {
  title: ReactNode;
  detail?: ReactNode;
  /** Marker shown when the step is neither done nor active, e.g. a number. */
  marker?: ReactNode;
  done?: boolean;
  active?: boolean;
  children?: ReactNode;
}

export function Step({ title, detail, marker, done, active, children }: StepProps) {
  return (
    <li className={cx("step", done && "done", active && "active")}>
      <span className="step-marker" aria-hidden="true">
        {done ? "✓" : marker}
      </span>
      <div className="step-body">
        <p className="step-title">{title}</p>
        {detail ? <p className="step-detail">{detail}</p> : null}
        {children}
      </div>
    </li>
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
  variant?: "solid" | "ghost";
}

export function Button({ variant = "solid", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={cx("btn", variant === "ghost" && "ghost", className)} {...rest} />;
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
