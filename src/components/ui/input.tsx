import * as React from "react";

import { cn } from "@/lib/utils";

type NativeInputProps = React.ComponentProps<"input">;

interface InputProps extends NativeInputProps {
  label?: string;
  floating?: boolean;
  containerClassName?: string;
  labelClassName?: string;
  supportingText?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      floating = true,
      containerClassName,
      labelClassName,
      supportingText,
      leadingIcon,
      trailingIcon,
      error,
      id,
      placeholder,
      ...rest
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const floatEnabled = floating && Boolean(label);

    const supportingId = supportingText ? `${inputId}-supporting` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy =
      [error ? errorId : undefined, !error ? supportingId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    const inputClasses = cn(
      "block w-full rounded-full border border-input bg-transparent px-4 py-3 text-sm text-foreground shadow-sm transition-all duration-300 ease-in-out focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      floatEnabled
        ? "placeholder-transparent peer"
        : "placeholder:text-muted-foreground peer",
      leadingIcon ? "pl-11" : null,
      trailingIcon ? "pr-11" : null,
      error
        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
        : null,
      className
    );

    const labelClasses = cn(
      "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-[#6b7280] transition-all duration-300 ease-in-out px-1 leading-tight bg-background",
      "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-primary",
      "peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-xs peer-[&:not(:placeholder-shown)]:text-[#6b7280]",
      leadingIcon ? "left-11" : null,
      labelClassName
    );

    const iconBaseClass =
      "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-300 ease-in-out peer-focus:text-primary";

    return (
      <div
        className={cn(
          floatEnabled ? "space-y-2" : "space-y-1",
          containerClassName
        )}
      >
        <div className="relative">
          {leadingIcon ? (
            <span className={cn(iconBaseClass, "left-4")}>{leadingIcon}</span>
          ) : null}

          <input
            id={inputId}
            ref={ref}
            type={type}
            placeholder={floatEnabled ? " " : placeholder}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            {...rest}
            className={inputClasses}
          />

          {floatEnabled && (
            <label htmlFor={inputId} className={labelClasses}>
              {label}
            </label>
          )}

          {trailingIcon ? (
            <span className={cn(iconBaseClass, "right-4")}>{trailingIcon}</span>
          ) : null}
        </div>

        {(error || supportingText) && (
          <p
            id={error ? errorId : supportingId}
            className={cn(
              "text-xs transition-colors duration-300 ease-in-out",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {error ?? supportingText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
