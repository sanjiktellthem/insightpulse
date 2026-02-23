import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const planTiers = ["starter", "growth", "pro", "enterprise"];
const statuses = ["active", "trial", "past_due", "canceled"];

async function main() {
  await prisma.dashboardPin.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.campaignAttribution.deleteMany();
  await prisma.marketingCampaign.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.productEvent.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.analyticsUser.deleteMany();
  await prisma.account.deleteMany();

  const accounts = Array.from({ length: 50 }).map(() => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    industry: faker.helpers.arrayElement(["SaaS", "Fintech", "HealthTech", "Ecommerce", "EdTech"]),
    city: faker.location.city(),
    country: faker.location.country(),
    planTier: faker.helpers.weightedArrayElement([
      { value: "starter", weight: 25 },
      { value: "growth", weight: 35 },
      { value: "pro", weight: 25 },
      { value: "enterprise", weight: 15 },
    ]),
    status: faker.helpers.weightedArrayElement([
      { value: "active", weight: 70 },
      { value: "trial", weight: 15 },
      { value: "past_due", weight: 8 },
      { value: "canceled", weight: 7 },
    ]),
    mrr: faker.number.float({ min: 200, max: 50000, fractionDigits: 2 }),
    churnReason: faker.helpers.maybe(() => faker.helpers.arrayElement(["budget_cuts", "low_adoption", "switched_competitor"]), { probability: 0.15 }),
    createdAt: faker.date.between({ from: "2022-01-01", to: "2025-01-01" }),
  }));

  await prisma.account.createMany({ data: accounts });

  const users = Array.from({ length: 500 }).map(() => {
    const accountId = faker.helpers.arrayElement(accounts).id;
    return {
      id: faker.string.uuid(),
      accountId,
      email: faker.internet.email().toLowerCase(),
      fullName: faker.person.fullName(),
      role: faker.helpers.arrayElement(["admin", "manager", "analyst", "member"]),
      isActive: faker.datatype.boolean(0.88),
      createdAt: faker.date.between({ from: "2022-01-01", to: "2025-01-01" }),
      lastSeenAt: faker.date.recent({ days: 45 }),
    };
  });

  await prisma.analyticsUser.createMany({ data: users });

  const subscriptions = accounts.map((acc) => ({
    id: faker.string.uuid(),
    accountId: acc.id,
    planTier: acc.planTier,
    status: acc.status,
    seats: faker.number.int({ min: 5, max: 400 }),
    startedAt: faker.date.between({ from: "2022-01-01", to: "2024-12-01" }),
    canceledAt: acc.status === "canceled" ? faker.date.recent({ days: 200 }) : null,
    cancelReason: acc.status === "canceled" ? faker.helpers.arrayElement(["price", "features", "support"]) : null,
    renewalDate: faker.date.soon({ days: 120 }),
  }));

  await prisma.subscription.createMany({ data: subscriptions });

  const invoices = Array.from({ length: 2000 }).map(() => {
    const acc = faker.helpers.arrayElement(accounts);
    const invoiceDate = faker.date.between({ from: "2023-01-01", to: "2025-01-01" });
    return {
      id: faker.string.uuid(),
      accountId: acc.id,
      invoiceDate,
      amount: faker.number.float({ min: 40, max: 12000, fractionDigits: 2 }),
      currency: "USD",
      status: faker.helpers.weightedArrayElement([
        { value: "paid", weight: 80 },
        { value: "open", weight: 12 },
        { value: "void", weight: 5 },
        { value: "overdue", weight: 3 },
      ]),
      paidAt: faker.helpers.maybe(() => faker.date.soon({ days: 15, refDate: invoiceDate }), { probability: 0.8 }),
    };
  });

  await prisma.invoice.createMany({ data: invoices });

  const events = Array.from({ length: 50000 }).map(() => {
    const acc = faker.helpers.arrayElement(accounts);
    return {
      id: faker.string.uuid(),
      accountId: acc.id,
      userId: faker.helpers.maybe(() => faker.helpers.arrayElement(users).id, { probability: 0.85 }),
      eventName: faker.helpers.arrayElement(["login", "report_export", "dashboard_view", "alert_created", "integration_sync"]),
      eventCategory: faker.helpers.arrayElement(["auth", "analytics", "automation", "collaboration"]),
      value: faker.helpers.maybe(() => faker.number.float({ min: 1, max: 100, fractionDigits: 2 }), { probability: 0.35 }),
      metadata: { region: faker.location.countryCode(), source: faker.internet.domainWord() },
      createdAt: faker.date.between({ from: "2023-01-01", to: "2025-01-20" }),
    };
  });

  for (let i = 0; i < events.length; i += 2000) {
    await prisma.productEvent.createMany({ data: events.slice(i, i + 2000) });
  }

  const tickets = Array.from({ length: 800 }).map(() => {
    const openedAt = faker.date.between({ from: "2023-01-01", to: "2025-01-01" });
    const resolved = faker.datatype.boolean(0.74);
    return {
      id: faker.string.uuid(),
      accountId: faker.helpers.arrayElement(accounts).id,
      priority: faker.helpers.arrayElement(["low", "medium", "high", "critical"]),
      status: resolved ? "resolved" : faker.helpers.arrayElement(["open", "waiting_on_customer", "in_progress"]),
      category: faker.helpers.arrayElement(["billing", "bug", "feature_request", "onboarding"]),
      openedAt,
      resolvedAt: resolved ? faker.date.soon({ days: 20, refDate: openedAt }) : null,
      csatScore: resolved ? faker.number.int({ min: 1, max: 5 }) : null,
    };
  });

  await prisma.supportTicket.createMany({ data: tickets });

  const campaigns = Array.from({ length: 120 }).map(() => {
    const startedAt = faker.date.between({ from: "2023-01-01", to: "2024-12-01" });
    return {
      id: faker.string.uuid(),
      accountId: faker.helpers.arrayElement(accounts).id,
      name: `${faker.company.buzzVerb()} ${faker.company.buzzNoun()}`,
      channel: faker.helpers.arrayElement(["google_ads", "linkedin", "meta", "email", "partner"]),
      spend: faker.number.float({ min: 500, max: 150000, fractionDigits: 2 }),
      impressions: faker.number.int({ min: 10000, max: 3000000 }),
      clicks: faker.number.int({ min: 1000, max: 120000 }),
      conversions: faker.number.int({ min: 30, max: 8000 }),
      startedAt,
      endedAt: faker.date.soon({ days: 120, refDate: startedAt }),
    };
  });

  await prisma.marketingCampaign.createMany({ data: campaigns });

  const attributions = Array.from({ length: 500 }).map(() => ({
    id: faker.string.uuid(),
    campaignId: faker.helpers.arrayElement(campaigns).id,
    accountId: faker.helpers.arrayElement(accounts).id,
    revenue: faker.number.float({ min: 100, max: 80000, fractionDigits: 2 }),
    attributedAt: faker.date.between({ from: "2023-01-01", to: "2025-01-20" }),
    source: faker.helpers.arrayElement(["first_touch", "last_touch", "multi_touch"]),
  }));

  await prisma.campaignAttribution.createMany({ data: attributions });

  console.log("Seed complete");
}

main().finally(async () => {
  await prisma.$disconnect();
});
