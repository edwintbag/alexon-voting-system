// utils/validation.ts
// Zod schemas for API request validation

import { z } from "zod";

const DepartmentEnum = z.enum([
  "CONSTRUCTION_MATERIALS",
  "EQUIPMENT_HIRE",
  "AGRIBUSINESS",
  "REAL_ESTATE",
  "ADMINISTRATION",
  "FINANCE",
  "HUMAN_RESOURCES",
  "OPERATIONS",
  "LOGISTICS",
  "SALES_MARKETING",
]);

const CategoryEnum = z.enum([
  "BLOCK_CABROS_PRODUCTION",
  "NON_MACHINE_PRODUCTION",
  "TEAM_LEADER",
]);

const RatingValueSchema = z.number().int().min(1).max(5);

const ProductionRatingsSchema = z.object({
  workEthic: RatingValueSchema,
  punctuality: RatingValueSchema,
  discipline: RatingValueSchema,
  teamSpirit: RatingValueSchema,
  initiative: RatingValueSchema,
});

const LeaderRatingsSchema = z.object({
  teamPerformance: RatingValueSchema,
  leadership: RatingValueSchema,
  disciplineManagement: RatingValueSchema,
  communication: RatingValueSchema,
  initiative: RatingValueSchema,
});

export const VoteSubmitSchema = z.object({
  voterName: z.string().min(2, "Name must be at least 2 characters").max(100),
  voterDepartment: DepartmentEnum,
  voterStaffNumber: z.string().optional(),
  candidateId: z.string().cuid("Invalid candidate ID"),
  category: CategoryEnum,
  ratings: z.union([ProductionRatingsSchema, LeaderRatingsSchema]),
  comment: z.string().max(500).optional(),
});

export type VoteSubmitInput = z.infer<typeof VoteSubmitSchema>;

export const AdminQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  category: CategoryEnum.optional(),
  secret: z.string(),
});

/**
 * Validate ratings keys match expected criteria for category
 */
export function validateRatingKeys(
  category: string,
  ratings: Record<string, number>
): boolean {
  const productionKeys = [
    "workEthic",
    "punctuality",
    "discipline",
    "teamSpirit",
    "initiative",
  ];
  const leaderKeys = [
    "teamPerformance",
    "leadership",
    "disciplineManagement",
    "communication",
    "initiative",
  ];

  const expectedKeys =
    category === "TEAM_LEADER" ? leaderKeys : productionKeys;
  const providedKeys = Object.keys(ratings);

  return (
    expectedKeys.every((k) => providedKeys.includes(k)) &&
    providedKeys.every((k) => expectedKeys.includes(k))
  );
}
