import { InputHTMLAttributes, ReactNode, useId } from "react";
import { cn } from "@/lib/utils/cn";

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: ReactNode;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  if (!label) {
    return (
      <input
        type="checkbox"
        id={checkboxId}
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
          "disabled:cursor-not-allowed disabled:text-gray-300",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <label
      htmlFor={checkboxId}
      className="flex items-center gap-2 cursor-pointer"
    >
      <input
        type="checkbox"
        id={checkboxId}
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
          "disabled:cursor-not-allowed disabled:text-gray-300",
          className,
        )}
        {...props}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
