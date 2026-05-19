// prisma/seed.ts — Alexon Group v3 — All 80 employees + 5 categories
import { PrismaClient, Department } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── All 80 employees ──────────────────────────────────
const employees: { name: string; department: Department; role?: string; isExcluded?: boolean }[] = [
  // Executive Management
  { name: "Christopher Kahuria", department: Department.EXECUTIVE_MANAGEMENT, role: "Group Manager" },
  // Finance & Admin
  { name: "Anna Mutheu", department: Department.FINANCE_ADMIN, role: "Finance & Admin" },
  // Procurement & Stores
  { name: "Sharon Kiplagat", department: Department.PROCUREMENT_STORES, role: "Procurement & Stores" },
  { name: "Wendy Akinyi", department: Department.PROCUREMENT_STORES, role: "Store Clerk" },
  { name: "Meshack Otieno", department: Department.PROCUREMENT_STORES, role: "Dispatch & Store Clerk" },
  // ICT
  { name: "Edwin Wango", department: Department.ICT_COMMS_LOGISTICS, role: "ICT, Communication & Logistics", isExcluded: true },
  // Engineering & Technical
  { name: "Martin Otieno", department: Department.ENGINEERING_TECHNICAL, role: "Engineer" },
  { name: "Cavin Ochieng", department: Department.ENGINEERING_TECHNICAL, role: "Electrician" },
  { name: "Zack John", department: Department.ENGINEERING_TECHNICAL, role: "Electrician & Driver" },
  { name: "Dennis Oduor Tarko", department: Department.ENGINEERING_TECHNICAL, role: "Welder" },
  // Sales
  { name: "Elizabeth Awino Onyango", department: Department.SALES, role: "Sales" },
  // Operations
  { name: "Alfred Omondi", department: Department.OPERATIONS_MANAGEMENT, role: "Operations Manager" },
  // Quarry
  { name: "Gabriel Otieno", department: Department.QUARRY, role: "Quarry" },
  // Heavy Machinery
  { name: "Austine Ouma", department: Department.HEAVY_MACHINERY, role: "Machinery Manager" },
  { name: "Sowed Oduol Mila", department: Department.HEAVY_MACHINERY, role: "Backhoe Operator" },
  { name: "Bonface Omondi", department: Department.HEAVY_MACHINERY, role: "Backhoe Operator" },
  { name: "Joseph Odera", department: Department.HEAVY_MACHINERY, role: "Backhoe Assistant" },
  { name: "Pauline Linder Awuor", department: Department.HEAVY_MACHINERY, role: "Backhoe Assistant" },
  { name: "Joash Olweje", department: Department.HEAVY_MACHINERY, role: "Excavator Operator" },
  // Transport & Fleet
  { name: "Peter Otieno Rian", department: Department.TRANSPORT_FLEET, role: "Core Driver" },
  { name: "Raphael Muganda Musawa", department: Department.TRANSPORT_FLEET, role: "Core Driver" },
  { name: "Charles Ameda", department: Department.TRANSPORT_FLEET, role: "Driver" },
  { name: "Charles Ouma Omiya", department: Department.TRANSPORT_FLEET, role: "Driver" },
  { name: "Stephen Ochieng Oduor", department: Department.TRANSPORT_FLEET, role: "Driver" },
  { name: "Zachary Jonyo", department: Department.TRANSPORT_FLEET, role: "Driver" },
  { name: "Calvin Oduor Juma", department: Department.TRANSPORT_FLEET, role: "Driver" },
  { name: "Hillary Onyango", department: Department.TRANSPORT_FLEET, role: "Car Wash" },
  // Production — Block Machine A
  { name: "Carillus Odera Ochido", department: Department.PRODUCTION, role: "Operator - Team Leader A" },
  { name: "Elvis Otieno Omollo", department: Department.PRODUCTION, role: "Production" },
  { name: "Kevin Omondi Oduor", department: Department.PRODUCTION, role: "Production" },
  { name: "Richard Odhiambo Otieno", department: Department.PRODUCTION, role: "Production" },
  { name: "Gordon Odero", department: Department.PRODUCTION, role: "Production" },
  { name: "Samuel Otieno", department: Department.PRODUCTION, role: "Production" },
  { name: "Vincent Onyango", department: Department.PRODUCTION, role: "Production" },
  { name: "Grace Atieno", department: Department.PRODUCTION, role: "Production" },
  { name: "Alvin Jaoko", department: Department.PRODUCTION, role: "Production" },
  { name: "Isack Ouma", department: Department.PRODUCTION, role: "Production" },
  // Production — Block Machine B
  { name: "David Otieno Onyango", department: Department.PRODUCTION, role: "Operator - Team Leader B" },
  { name: "Brian Omondi", department: Department.PRODUCTION, role: "Production" },
  { name: "Brian Otieno Oduor", department: Department.PRODUCTION, role: "Production" },
  { name: "Esther Atieno", department: Department.PRODUCTION, role: "Production" },
  { name: "Isack Onyango Ochanda", department: Department.PRODUCTION, role: "Production" },
  { name: "Joshua Otieno", department: Department.PRODUCTION, role: "Production" },
  { name: "Bonface Ouma", department: Department.PRODUCTION, role: "Production" },
  { name: "Timothy Odhiambo", department: Department.PRODUCTION, role: "Production" },
  { name: "Gerald Otieno", department: Department.PRODUCTION, role: "Production" },
  // Production — Fencing Posts & Culverts
  { name: "Vincent Otieno", department: Department.PRODUCTION, role: "Fencing Leader" },
  { name: "Benard Oyugi", department: Department.PRODUCTION, role: "Production" },
  { name: "Geoffry Otieno Omondi", department: Department.PRODUCTION, role: "Production" },
  { name: "Mark Ochieng", department: Department.PRODUCTION, role: "Production" },
  { name: "Martin Safu Chiteri", department: Department.PRODUCTION, role: "Production" },
  { name: "Raymond Odhiambo", department: Department.PRODUCTION, role: "Production" },
  { name: "Kevin Namanjia", department: Department.PRODUCTION, role: "Production" },
  { name: "Bevine Juma", department: Department.PRODUCTION, role: "Production" },
  { name: "Peter Chesaala", department: Department.PRODUCTION, role: "Production" },
  { name: "Kennedy Odhiambo", department: Department.PRODUCTION, role: "Production" },
  { name: "Robert Ochieng", department: Department.PRODUCTION, role: "Production" },
  { name: "Moses Ochieng", department: Department.PRODUCTION, role: "Production" },
  { name: "Alex Ambeyi", department: Department.PRODUCTION, role: "Production" },
  { name: "John Nanyomi", department: Department.PRODUCTION, role: "Production" },
  // Production — Non-Machine (Loaders)
  { name: "Jeff Odhiambo", department: Department.PRODUCTION, role: "Loader & Off-loader" },
  { name: "Anold Otieno", department: Department.PRODUCTION, role: "Loader & Off-loader" },
  { name: "Derrick Onyango", department: Department.PRODUCTION, role: "Loader & Off-loader" },
  { name: "Emmanuel Ochieng", department: Department.PRODUCTION, role: "Loader & Off-loader" },
  { name: "Caleb Omondi", department: Department.PRODUCTION, role: "Loader & Off-loader" },
  { name: "Caleb Andrew", department: Department.PRODUCTION, role: "Loader & Off-loader" },
  { name: "Isaac Ndeta", department: Department.PRODUCTION, role: "Loader & Off-loader" },
  // Production — Curing & Cleaning
  { name: "Emma Anyango Omole", department: Department.PRODUCTION, role: "Curing & Cleaning" },
  { name: "Consolata Auma Mumali", department: Department.PRODUCTION, role: "Curing & Cleaning" },
  // Others in production list
  { name: "Denzel Odhiambo", department: Department.PRODUCTION, role: "Production" },
  { name: "Joseph Otieno Okoth", department: Department.PRODUCTION, role: "Production" },
  { name: "Rolex Ochieng", department: Department.PRODUCTION, role: "Production" },
  { name: "Silas Ouma", department: Department.PRODUCTION, role: "Production" },
  { name: "Victor Odhiambo", department: Department.PRODUCTION, role: "Production" },
  { name: "Daisy Atieno", department: Department.PRODUCTION, role: "Production" },
  { name: "Jacinter Atieno", department: Department.PRODUCTION, role: "Production" },
  { name: "Philip Otieno", department: Department.PRODUCTION, role: "Production" },
  { name: "Belinda Awino", department: Department.PRODUCTION, role: "Production" },
  // Construction
  { name: "Tobias Rian", department: Department.CONSTRUCTION, role: "Construction Manager" },
  { name: "Martin Otieno Eng", department: Department.CONSTRUCTION, role: "Engineer Technician" },
];

// ── Categories & members ──────────────────────────────
const categories = [
  {
    name: "Block Machine A",
    description: "Block Machine A production team",
    order: 1,
    members: [
      { name: "Carillus Odera Ochido", isLeader: true },
      { name: "Elvis Otieno Omollo" },
      { name: "Kevin Omondi Oduor" },
      { name: "Richard Odhiambo Otieno" },
      { name: "Gordon Odero" },
      { name: "Samuel Otieno" },
      { name: "Vincent Onyango" },
      { name: "Grace Atieno" },
      { name: "Alvin Jaoko" },
      { name: "Isack Ouma" },
    ],
  },
  {
    name: "Block Machine B",
    description: "Block Machine B production team",
    order: 2,
    members: [
      { name: "David Otieno Onyango", isLeader: true },
      { name: "Brian Omondi" },
      { name: "Brian Otieno Oduor" },
      { name: "Esther Atieno" },
      { name: "Isack Onyango Ochanda" },
      { name: "Joshua Otieno" },
      { name: "Bonface Ouma" },
      { name: "Timothy Odhiambo" },
      { name: "Gerald Otieno" },
    ],
  },
  {
    name: "Fencing Posts & Culverts",
    description: "Fencing posts and culverts production team",
    order: 3,
    members: [
      { name: "Vincent Otieno", isLeader: true },
      { name: "Benard Oyugi" },
      { name: "Geoffry Otieno Omondi" },
      { name: "Mark Ochieng" },
      { name: "Martin Safu Chiteri" },
      { name: "Raymond Odhiambo" },
      { name: "Kevin Namanjia" },
      { name: "Bevine Juma" },
      { name: "Peter Chesaala" },
      { name: "Kennedy Odhiambo" },
      { name: "Robert Ochieng" },
      { name: "Moses Ochieng" },
      { name: "Alex Ambeyi" },
      { name: "John Nanyomi" },
    ],
  },
  {
    name: "Non-Machine Production",
    description: "Loaders, off-loaders, curing, cleaning and stores",
    order: 4,
    members: [
      { name: "Jeff Odhiambo" },
      { name: "Anold Otieno" },
      { name: "Derrick Onyango" },
      { name: "Emmanuel Ochieng" },
      { name: "Caleb Omondi" },
      { name: "Caleb Andrew" },
      { name: "Isaac Ndeta" },
      { name: "Emma Anyango Omole" },
      { name: "Consolata Auma Mumali" },
      { name: "Sharon Kiplagat" },
      { name: "Wendy Akinyi" },
      { name: "Meshack Otieno" },
    ],
  },
  {
    name: "Team Leaders - Production",
    description: "Production team leaders across all groups",
    order: 5,
    members: [
      { name: "Vincent Otieno", isLeader: true },
      { name: "David Otieno Onyango", isLeader: true },
      { name: "Carillus Odera Ochido", isLeader: true },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding Alexon Group v3...\n");

  // ── Clear all data ──────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.adminSession.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.monthlyResult.deleteMany();
  await prisma.categoryMember.deleteMany();
  await prisma.category.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.employee.deleteMany();
  console.log("✅ Cleared existing data");

  // ── Seed employees with AX001-AX080 ────────────────
  let staffNum = 1;
  const employeeMap = new Map<string, string>(); // name -> id

  for (const emp of employees) {
    const staffNumber = `AX${String(staffNum).padStart(3, "0")}`;
    const created = await prisma.employee.create({
      data: {
        name: emp.name,
        staffNumber,
        department: emp.department,
        role: emp.role,
        isExcluded: emp.isExcluded ?? false,
        isActive: true,
      },
    });
    employeeMap.set(emp.name, created.id);
    staffNum++;
  }
  console.log(`✅ Seeded ${employees.length} employees (AX001–AX${String(staffNum - 1).padStart(3, "0")})`);

  // ── Seed categories & members ───────────────────────
  for (const cat of categories) {
    const created = await prisma.category.create({
      data: { name: cat.name, description: cat.description, order: cat.order },
    });

    let added = 0;
    for (const member of cat.members) {
      const empId = employeeMap.get(member.name);
      if (!empId) { console.warn(`  ⚠️  Not found: ${member.name} in ${cat.name}`); continue; }
      await prisma.categoryMember.create({
        data: { categoryId: created.id, employeeId: empId, isLeader: member.isLeader ?? false },
      });
      added++;
    }
    console.log(`✅ Category "${cat.name}" — ${added} members`);
  }

  // ── Create Super Admin ──────────────────────────────
  const passwordHash = await bcrypt.hash("SuperAdmin@2024", 12);
  await prisma.adminUser.create({
    data: { email: "wangoedwin@gmail.com", name: "Edwin Wango", passwordHash, role: "SUPER_ADMIN", isActive: true },
  });
  console.log("\n✅ Super Admin created:");
  console.log("   📧 wangoedwin@gmail.com");
  console.log("   🔑 SuperAdmin@2024");
  console.log("   ⚠️  Change password after first login!\n");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

// Seed default voting schedule
async function seedSchedule() {
  await prisma.votingSchedule.deleteMany();
  await prisma.votingSchedule.create({
    data: {
      recurringStartDay: 25,
      recurringEndDay: 30,
      recurringStartHour: 8,
      recurringEndHour: 17,
      isManualOverride: false,
      isActive: true,
    },
  });
  console.log("✅ Default voting schedule created (25th-30th, 8AM-5PM)");
}

// Seed vehicle & plant teams
async function seedTeams() {
  await prisma.teamRating.deleteMany();
  await prisma.teamVote.deleteMany();
  await prisma.vehicleTeamMember.deleteMany();
  await prisma.vehicleTeam.deleteMany();

  const teams = [
    { regNumber: "KDV 118X", vehicleType: "Water Bowser", description: "Omiya & Calvin", order: 1,
      members: [
        { name: "Charles Ouma Omiya", role: "Driver" },
        { name: "Calvin Oduor Juma", role: "Co-Driver" },
      ]
    },
    { regNumber: "KDW 288H", vehicleType: "MGUU 10", description: "Ameda & Raphael", order: 2,
      members: [
        { name: "Charles Ameda", role: "Driver" },
        { name: "Raphael Muganda Musawa", role: "Co-Driver" },
      ]
    },
    { regNumber: "KDV 946M", vehicleType: "MGUU 6", description: "Zakaria", order: 3,
      members: [{ name: "Zachary Jonyo", role: "Driver" }]
    },
    { regNumber: "KDX 974Q", vehicleType: "Pickup (New)", description: "Stephene", order: 4,
      members: [{ name: "Stephen Ochieng Oduor", role: "Driver" }]
    },
    { regNumber: "KHMA 821X", vehicleType: "Backhoe 1", description: "Sowed & Pauline", order: 5,
      members: [
        { name: "Sowed Oduol Mila", role: "Operator" },
        { name: "Pauline Linder Awuor", role: "Assistant" },
      ]
    },
    { regNumber: "C-3689", vehicleType: "Backhoe 2", description: "Bonface & Joseph", order: 6,
      members: [
        { name: "Bonface Omondi", role: "Operator" },
        { name: "Joseph Odera", role: "Assistant" },
      ]
    },
    { regNumber: "C-8639", vehicleType: "Excavator", description: "Joash", order: 7,
      members: [{ name: "Joash Olweje", role: "Operator" }]
    },
  ];

  const allEmployees = await prisma.employee.findMany();
  const empMap = new Map(allEmployees.map(e => [e.name, e.id]));

  for (const team of teams) {
    const created = await prisma.vehicleTeam.create({
      data: {
        name: `${team.regNumber} — ${team.vehicleType}`,
        regNumber: team.regNumber,
        vehicleType: team.vehicleType,
        description: team.description,
        order: team.order,
      }
    });
    for (const member of team.members) {
      const empId = empMap.get(member.name);
      if (!empId) { console.warn(`  ⚠️ Not found: ${member.name}`); continue; }
      await prisma.vehicleTeamMember.create({
        data: { teamId: created.id, employeeId: empId, role: member.role }
      });
    }
    console.log(`✅ Team: ${created.name} (${team.members.length} members)`);
  }
}

seedTeams().catch(console.error).finally(() => prisma.$disconnect());
