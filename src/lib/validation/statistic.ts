import { z } from "zod";
import { text } from "./common";

export const statisticInput = z.object({
  label: text(1, 80),
  value: text(1, 20),
  is_active: z.boolean(),
});

export type StatisticInput = z.infer<typeof statisticInput>;
