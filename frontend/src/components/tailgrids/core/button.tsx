import type { ComponentProps } from "react";
import { buttonStyles } from "./button.styles";

type PropsType = ComponentProps<"button"> & {
  variant?: "primary" | "danger" | "success" | "ghost";
  appearance?: "fill" | "outline";
  iconOnly?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
};

export function Button({
  variant,
  appearance,
  iconOnly,
  size,
  children,
  className,
  ...props
}: PropsType) {
  return (
    <button
      type="button"
      className={`${buttonStyles({
        variant,
        appearance,
        iconOnly,
        size
      })} ${className || ''}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
