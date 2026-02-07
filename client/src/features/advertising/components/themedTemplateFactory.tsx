/**
 * Factory for themed templates (keeps Fast Refresh happy)
 */
import { forwardRef } from "react";
import type { TemplateProps, TemplateType } from "../types/advertising.types";
import ThemedTemplate from "./ThemedTemplate";

export function createThemedTemplate(variant: TemplateType) {
  return forwardRef<HTMLDivElement, TemplateProps>((props, ref) => (
    <ThemedTemplate ref={ref} variant={variant} {...props} />
  ));
}
