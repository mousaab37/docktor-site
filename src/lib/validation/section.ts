import { z } from "zod";
import { SECTION_KEYS } from "../types";

/** The form of the visibility switch (`intent=section-visibility`). */
export const sectionVisibilityInput = z.object({
  key: z.enum(SECTION_KEYS),
  visible: z.boolean(),
});

export type SectionVisibilityInput = z.infer<typeof sectionVisibilityInput>;
