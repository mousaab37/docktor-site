import { z } from "zod";
import { optDate, optText, text } from "./common";

export const certificateInput = z.object({
  title: text(1, 150),
  issuing_organization: optText(150),
  issue_date: optDate,
  description: optText(1000),
  image_path: optText(500),
  is_active: z.boolean(),
});

export type CertificateInput = z.infer<typeof certificateInput>;
