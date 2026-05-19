// types/index.ts — Alexon Group v3

export type Department =
  | "EXECUTIVE_MANAGEMENT" | "FINANCE_ADMIN" | "PROCUREMENT_STORES"
  | "ICT_COMMS_LOGISTICS" | "ENGINEERING_TECHNICAL" | "SALES"
  | "OPERATIONS_MANAGEMENT" | "QUARRY" | "HEAVY_MACHINERY"
  | "TRANSPORT_FLEET" | "PRODUCTION" | "CONSTRUCTION";

export const DEPARTMENT_LABELS: Record<Department, string> = {
  EXECUTIVE_MANAGEMENT: "Executive Management",
  FINANCE_ADMIN: "Finance & Administration",
  PROCUREMENT_STORES: "Procurement & Stores",
  ICT_COMMS_LOGISTICS: "ICT, Communication & Logistics",
  ENGINEERING_TECHNICAL: "Engineering & Technical",
  SALES: "Sales",
  OPERATIONS_MANAGEMENT: "Operations Management",
  QUARRY: "Quarry",
  HEAVY_MACHINERY: "Heavy Machinery Operations",
  TRANSPORT_FLEET: "Transport & Fleet",
  PRODUCTION: "Production",
  CONSTRUCTION: "Construction",
};

export interface CriterionDef { key: string; label: string; description: string; }

export const PRODUCTION_CRITERIA: CriterionDef[] = [
  { key: "workEthic", label: "Work Ethic & Output", description: "Consistently delivers quality work with strong effort" },
  { key: "punctuality", label: "Punctuality & Attendance", description: "Arrives on time and maintains excellent attendance" },
  { key: "discipline", label: "Discipline", description: "Follows rules, stays focused, maintains professionalism" },
  { key: "teamSpirit", label: "Team Spirit & Collaboration", description: "Works well with others and supports the team" },
  { key: "initiative", label: "Initiative", description: "Takes proactive steps beyond assigned duties" },
];

export const LEADER_CRITERIA: CriterionDef[] = [
  { key: "teamPerformance", label: "Team Performance", description: "Drives team to achieve and exceed targets" },
  { key: "leadership", label: "Leadership & Coordination", description: "Effectively leads, delegates, and coordinates" },
  { key: "disciplineManagement", label: "Discipline Management", description: "Maintains order and addresses issues professionally" },
  { key: "communication", label: "Communication", description: "Communicates clearly and listens actively" },
  { key: "initiative", label: "Initiative & Improvement", description: "Identifies opportunities and drives improvement" },
];

// Dynamic category from DB
export interface CategoryRecord {
  id: string;
  name: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  _count?: { members: number };
}

export interface EmployeeRecord {
  id: string;
  name: string;
  staffNumber: string;
  department: Department;
  role?: string | null;
  isLeader?: boolean;
}

export interface RatingMap { [criterion: string]: number; }

export interface VoterInfo {
  employeeId: string;
  employeeName: string;
  staffNumber: string;
  department: Department;
}

export interface VoteFormState {
  step: 1 | 2 | 3 | 4 | 5;
  voterInfo: VoterInfo | null;
  selectedCategory: CategoryRecord | null;
  selectedCandidate: EmployeeRecord | null;
  ratings: RatingMap;
  comment: string;
}

export interface VoteSubmitPayload {
  voterEmployeeId: string;
  candidateId: string;
  categoryId: string;
  ratings: RatingMap;
  comment?: string;
}

// ── Driver & Operator criteria ───────────────────────

export const DRIVER_CRITERIA: CriterionDef[] = [
  { key: "vehicleMaintenance", label: "Vehicle Maintenance", description: "Keeps vehicle clean, fueled and well maintained" },
  { key: "punctuality", label: "Punctuality & Availability", description: "Always on time and available when needed" },
  { key: "safeDriving", label: "Safe Driving / Operation", description: "Follows road/machine safety rules consistently" },
  { key: "teamwork", label: "Teamwork", description: "Works well with co-driver or assistant" },
  { key: "reliability", label: "Reliability", description: "Dependable, consistent and responsible" },
];

// ── Team record ──────────────────────────────────────
export interface VehicleTeamRecord {
  id: string;
  name: string;
  regNumber: string;
  vehicleType: string;
  description: string | null;
  members: {
    role: string;
    employee: { id: string; name: string; staffNumber: string; };
  }[];
}
