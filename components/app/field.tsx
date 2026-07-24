import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Form field on the Klipr Glass system: label + recessed well control +
 * inline error. Server-safe (pairs with useActionState in client forms.
 * pass the field's error string from the action state).
 */
const controlBase =
  "focus-quiet w-full rounded-[--radius-control] glass-well px-3.5 py-2.5 text-[14.5px] text-text-hi placeholder:text-text-low focus:border-[rgba(125,4,215,0.5)] focus:bg-[rgba(53,5,90,0.06)] transition-colors";

function Wrap({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-text-hi">
        {label}
        {hint ? <span className="ml-2 font-normal text-text-low">{hint}</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12.5px] font-medium text-[#c81e6f]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  className,
  id,
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? `f-${rest.name}`;
  return (
    <Wrap label={label} htmlFor={fieldId} hint={hint} error={error}>
      <input id={fieldId} className={cn(controlBase, className)} {...rest} />
    </Wrap>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  id,
  children,
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = id ?? `f-${rest.name}`;
  return (
    <Wrap label={label} htmlFor={fieldId} hint={hint} error={error}>
      <select id={fieldId} className={cn(controlBase, "appearance-none", className)} {...rest}>
        {children}
      </select>
    </Wrap>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  id,
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id ?? `f-${rest.name}`;
  return (
    <Wrap label={label} htmlFor={fieldId} hint={hint} error={error}>
      <textarea id={fieldId} className={cn(controlBase, "min-h-[96px] resize-y", className)} {...rest} />
    </Wrap>
  );
}
