import "dotenv/config";

import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

type SeedOptions = {
  users: number;
  weeks: number;
  perWeek: number;
  wipe: boolean;
};

type SeedUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SeedOrganization = {
  id: string;
  name: string;
  slug: string;
  address: string;
  currency: string;
  gstin: string;
  stateCode: string;
  phone: string;
  website: string;
  ownerId: string;
  defaultTemplate: string;
  invoicePrefix: string;
  defaultDueDays: number;
  whatsappNumber: string;
  inventoryTrackingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type SeedCustomer = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  stateCode: string;
  isRegistered: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};

type SeedProduct = {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  description: string;
  productKind: "GOOD" | "SERVICE";
  price: number;
  hsnCode: string;
  taxRate: string;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
};

type SeedInvoice = {
  id: string;
  organizationId: string;
  customerId: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  placeOfSupply: string | null;
  status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  cancelRemark: string | null;
  subTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  discountTotal: number;
  total: number;
  notes: string | null;
  customerDetails: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  shippingName: string | null;
  isAnomaly: boolean;
  anomalyReason: string | null;
  anomalyScore: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type SeedInvoiceItem = {
  id: string;
  invoiceId: string;
  productId: string | null;
  description: string;
  hsnCode: string | null;
  quantity: string;
  unitPrice: number;
  unit: string | null;
  taxRate: string;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  discount: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
};

type SeedPayment = {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  method: string | null;
  notes: string | null;
  gatewayProvider: string | null;
  gatewayPaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OrgBundle = {
  user: SeedUser;
  organization: SeedOrganization;
  customers: SeedCustomer[];
  products: SeedProduct[];
  invoices: SeedInvoice[];
  items: SeedInvoiceItem[];
  payments: SeedPayment[];
};

type CatalogProduct = {
  name: string;
  kind: "GOOD" | "SERVICE";
  priceRupees: number;
  taxRate: number;
  unit: string;
  hsnCode: string;
  description: string;
};

type PersonName = {
  first: string;
  last: string;
};

const prisma = new PrismaClient();
const AMOUNT_SCALE = 100;
const CHUNK_SIZE = 25;
const DEMO_PASSWORD = "demo1234";

const ORG_TEMPLATES = [
  "Studio", "Traders", "Foods", "Systems", "Works", "Supply", "Labs", "Retail",
  "Textiles", "Mart", "Services", "Crafts", "Tech", "Exports", "Enterprises",
];

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ishaan", "Krish",
  "Anaya", "Diya", "Aadhya", "Kavya", "Ira", "Myra", "Saanvi", "Kiara",
  "Rohan", "Priya", "Neha", "Karthik", "Manish", "Pooja", "Sneha", "Nitin",
  "Rahul", "Aisha", "Naina", "Ritika", "Harsh", "Meera", "Dev", "Ankit",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Gupta", "Kumar", "Nair", "Reddy", "Iyer", "Verma",
  "Singh", "Joshi", "Agarwal", "Kapoor", "Malhotra", "Bansal", "Jain", "Shah",
  "Mishra", "Yadav", "Mehta", "Pillai", "Desai", "Rao", "Kulkarni", "Saxena",
];

const CITY_BY_STATE: Array<{ stateCode: string; city: string; state: string }> = [
  { stateCode: "27", city: "Mumbai", state: "Maharashtra" },
  { stateCode: "29", city: "Bengaluru", state: "Karnataka" },
  { stateCode: "07", city: "New Delhi", state: "Delhi" },
  { stateCode: "24", city: "Ahmedabad", state: "Gujarat" },
  { stateCode: "33", city: "Chennai", state: "Tamil Nadu" },
  { stateCode: "36", city: "Hyderabad", state: "Telangana" },
  { stateCode: "32", city: "Kochi", state: "Kerala" },
  { stateCode: "09", city: "Lucknow", state: "Uttar Pradesh" },
  { stateCode: "19", city: "Kolkata", state: "West Bengal" },
  { stateCode: "08", city: "Jaipur", state: "Rajasthan" },
];

const PRODUCT_CATALOG: CatalogProduct[] = [
  { name: "GST Filing Service", kind: "SERVICE", priceRupees: 3500, taxRate: 18, unit: "job", hsnCode: "998319", description: "Monthly compliance filing support" },
  { name: "Website Maintenance", kind: "SERVICE", priceRupees: 8200, taxRate: 18, unit: "month", hsnCode: "998314", description: "Retainer for content and bug fixes" },
  { name: "Office Chairs", kind: "GOOD", priceRupees: 6200, taxRate: 18, unit: "pcs", hsnCode: "940130", description: "Ergonomic chairs for office setups" },
  { name: "Printed Labels", kind: "GOOD", priceRupees: 450, taxRate: 12, unit: "pack", hsnCode: "482110", description: "Product barcode and shelf labels" },
  { name: "Packaging Box", kind: "GOOD", priceRupees: 120, taxRate: 12, unit: "pcs", hsnCode: "481910", description: "Corrugated shipping boxes" },
  { name: "Retail Shelf Audit", kind: "SERVICE", priceRupees: 1800, taxRate: 18, unit: "visit", hsnCode: "998599", description: "In-store merchandising and stock audit" },
  { name: "Invoice Printer Paper", kind: "GOOD", priceRupees: 280, taxRate: 5, unit: "ream", hsnCode: "480256", description: "A4 printing paper for invoices" },
  { name: "Logo Refresh", kind: "SERVICE", priceRupees: 9500, taxRate: 18, unit: "job", hsnCode: "998391", description: "Branding update and usage kit" },
  { name: "Safety Gloves", kind: "GOOD", priceRupees: 340, taxRate: 5, unit: "pair", hsnCode: "611610", description: "Protective gloves for warehouse teams" },
  { name: "Consulting Hours", kind: "SERVICE", priceRupees: 2500, taxRate: 18, unit: "hour", hsnCode: "998312", description: "Business process consulting" },
  { name: "LED Panel Light", kind: "GOOD", priceRupees: 1750, taxRate: 12, unit: "pcs", hsnCode: "940510", description: "Low-power indoor lighting panel" },
  { name: "Custom T-Shirts", kind: "GOOD", priceRupees: 650, taxRate: 12, unit: "pcs", hsnCode: "610910", description: "Printed tees for teams and events" },
  { name: "Bookkeeping Support", kind: "SERVICE", priceRupees: 5600, taxRate: 18, unit: "month", hsnCode: "998221", description: "Monthly bookkeeping service" },
  { name: "Steel Water Bottle", kind: "GOOD", priceRupees: 480, taxRate: 12, unit: "pcs", hsnCode: "732393", description: "Corporate gifting inventory" },
  { name: "Delivery Coordination", kind: "SERVICE", priceRupees: 1400, taxRate: 18, unit: "trip", hsnCode: "996511", description: "Last-mile delivery planning" },
];

const PAYMENT_METHODS = ["UPI", "Bank Transfer", "Cash", "Card"];
const NOTE_POOL = [
  "Thank you for your business.",
  "Payment due within agreed credit period.",
  "Please reference invoice number in payment note.",
  "Includes standard support and delivery.",
];

function parseArgs(argv: string[]): SeedOptions {
  const options: SeedOptions = {
    users: 1050,
    weeks: 12,
    perWeek: 5,
    wipe: argv.includes("--wipe"),
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, rawValue] = arg.slice(2).split("=");
    if (rawValue === undefined) continue;
    const value = Number.parseInt(rawValue, 10);
    if (!Number.isFinite(value) || value <= 0) continue;
    if (key === "users") options.users = value;
    if (key === "weeks") options.weeks = value;
    if (key === "per-week") options.perWeek = value;
  }

  return options;
}

function pad(value: number, size: number): string {
  return String(value).padStart(size, "0");
}

function choose<T>(items: T[], indexSeed: number): T {
  return items[indexSeed % items.length];
}

function makeName(index: number): PersonName {
  return {
    first: choose(FIRST_NAMES, index),
    last: choose(LAST_NAMES, index * 7),
  };
}

function normalizeSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function randomUuid(): string {
  return randomUUID();
}

function toPaise(rupees: number): number {
  return Math.round(rupees * AMOUNT_SCALE);
}

function jitter(index: number, modulo: number, offset = 0): number {
  return ((index * 17 + offset) % modulo);
}

function quantityString(quantity: number): string {
  return quantity.toFixed(4);
}

function makeGstin(stateCode: string, index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const a = letters[index % letters.length];
  const b = letters[(index * 5) % letters.length];
  const c = letters[(index * 11) % letters.length];
  return `${stateCode}${pad((index % 9999) + 1, 4)}${a}${b}${c}${pad((index % 99) + 1, 2)}1Z${index % 10}`;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function invoiceStatus(index: number, issueDate: Date, dueDate: Date): SeedInvoice["status"] {
  const bucket = index % 20;
  if (bucket < 10) return "PAID";
  if (bucket < 14) return "SENT";
  if (bucket < 16) return "DRAFT";
  if (bucket < 18) return "OVERDUE";
  if (bucket === 18) return "PARTIALLY_PAID";
  if (issueDate > new Date() || dueDate > new Date()) return "SENT";
  return "CANCELLED";
}

function computeLineTotal(
  quantity: number,
  unitPrice: number,
  discount: number,
  taxRate: number,
  interState: boolean,
) {
  const subTotal = quantity * unitPrice;
  const taxable = subTotal - discount;
  const totalTax = Math.round((taxable * taxRate) / 100);
  const cgst = interState ? 0 : Math.floor(totalTax / 2);
  const sgst = interState ? 0 : totalTax - cgst;
  const igst = interState ? totalTax : 0;

  return {
    subTotal,
    discount,
    cgst,
    sgst,
    igst,
    total: taxable + cgst + sgst + igst,
  };
}

function makeBundle(index: number, options: SeedOptions, passwordHash: string): OrgBundle {
  const person = makeName(index);
  const geo = choose(CITY_BY_STATE, index);
  const userId = randomUuid();
  const orgId = randomUuid();
  const createdAt = daysAgo(180 - (index % 160));
  createdAt.setDate(createdAt.getDate() - jitter(index, 7));
  const updatedAt = addDays(createdAt, Math.max(2, jitter(index, 30) + 2));

  const orgLabel = `${person.last} ${choose(ORG_TEMPLATES, index * 3)}`;
  const slug = `${normalizeSlug(orgLabel)}-${pad(index + 1, 4)}`;
  const email = index === 0 ? "demo@invoice.app" : `user${pad(index + 1, 4)}@invoice.app`;
  const phone = `9${pad(100000000 + index, 9)}`.slice(0, 10);

  const user: SeedUser = {
    id: userId,
    email,
    name: `${person.first} ${person.last}`,
    password: passwordHash,
    isOnboarded: true,
    createdAt,
    updatedAt,
  };

  const organization: SeedOrganization = {
    id: orgId,
    name: orgLabel,
    slug,
    address: `${(index % 72) + 8}, ${geo.city} Market Road, ${geo.city}, ${geo.state}`,
    currency: "INR",
    gstin: makeGstin(geo.stateCode, index + 100),
    stateCode: geo.stateCode,
    phone,
    website: `https://${slug}.example.com`,
    ownerId: userId,
    defaultTemplate: "modern",
    invoicePrefix: "INV",
    defaultDueDays: 21 + (index % 10),
    whatsappNumber: phone,
    inventoryTrackingEnabled: false,
    createdAt,
    updatedAt,
  };

  const customerCount = 8 + (index % 5);
  const productCount = 8 + ((index * 3) % 8);
  const customers: SeedCustomer[] = [];
  const products: SeedProduct[] = [];
  const invoices: SeedInvoice[] = [];
  const items: SeedInvoiceItem[] = [];
  const payments: SeedPayment[] = [];

  for (let i = 0; i < customerCount; i++) {
    const customerName = makeName(index * 13 + i + 5);
    const sameState = (i + index) % 3 !== 0;
    const isIndividual = (index + i) % 4 === 0;
    const customerGeo = sameState ? geo : choose(CITY_BY_STATE, index + i + 3);
    const customerCreatedAt = addDays(createdAt, i + 1);
    customers.push({
      id: randomUuid(),
      organizationId: orgId,
      name: isIndividual
        ? `${customerName.first} ${customerName.last}`
        : `${customerName.first} ${customerName.last} ${sameState ? "Stores" : "Distributors"}`,
      email: `accounts.${pad(index + 1, 4)}.${i + 1}@buyer.app`,
      phone: `8${pad(200000000 + index * 10 + i, 9)}`.slice(0, 10),
      address: `${20 + i}, Trade Centre, ${customerGeo.city}, ${customerGeo.state}`,
      gstin: makeGstin(customerGeo.stateCode, index * 50 + i + 1),
      stateCode: customerGeo.stateCode,
      isRegistered: true,
      description: sameState ? "Repeat local buyer" : "Inter-state wholesale account",
      createdAt: customerCreatedAt,
      updatedAt: customerCreatedAt,
    });
  }

  for (let i = 0; i < productCount; i++) {
    const catalog = choose(PRODUCT_CATALOG, index * 5 + i);
    const productCreatedAt = addDays(createdAt, i + 1);
    products.push({
      id: randomUuid(),
      organizationId: orgId,
      sku: `SKU-${pad(index + 1, 4)}-${pad(i + 1, 3)}`,
      name: catalog.name,
      description: catalog.description,
      productKind: catalog.kind,
      price: toPaise(catalog.priceRupees + ((index + i) % 4) * 25),
      hsnCode: catalog.hsnCode,
      taxRate: catalog.taxRate.toFixed(2),
      unit: catalog.unit,
      createdAt: productCreatedAt,
      updatedAt: productCreatedAt,
    });
  }

  let invoiceCounter = 1;
  for (let week = 0; week < options.weeks; week++) {
    const weeklyCount = Math.max(3, options.perWeek + ((index + week) % 3) - 1);
    for (let seq = 0; seq < weeklyCount; seq++) {
      const customer = customers[(week + seq + index) % customers.length];
      const invoiceId = randomUuid();
      const issueDate = daysAgo((options.weeks - week) * 7 - seq - 1);
      issueDate.setHours(10 + ((index + seq) % 6), 15, 0, 0);
      const dueDate = addDays(issueDate, 10 + ((seq + index) % 18));
      const interState = customer.stateCode !== organization.stateCode;
      const itemCount = 1 + ((index + week + seq) % 3);
      let subTotal = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      let igstTotal = 0;
      let discountTotal = 0;

      for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
        const product = products[(week * 3 + seq + itemIndex) % products.length];
        const quantity = 1 + ((itemIndex + index + seq) % 4);
        const unitPrice = product.price;
        const discount = (itemIndex + seq) % 4 === 0 ? Math.round(unitPrice * 0.05) : 0;
        const taxRate = Number(product.taxRate);
        const line = computeLineTotal(quantity, unitPrice, discount, taxRate, interState);
        subTotal += line.subTotal;
        cgstTotal += line.cgst;
        sgstTotal += line.sgst;
        igstTotal += line.igst;
        discountTotal += line.discount;

        items.push({
          id: randomUuid(),
          invoiceId,
          productId: product.id,
          description: product.name,
          hsnCode: product.hsnCode,
          quantity: quantityString(quantity),
          unitPrice,
          unit: product.unit,
          taxRate: product.taxRate,
          cgstAmount: line.cgst,
          sgstAmount: line.sgst,
          igstAmount: line.igst,
          discount: line.discount,
          total: line.total,
          createdAt: issueDate,
          updatedAt: issueDate,
        });
      }

      const total = subTotal - discountTotal + cgstTotal + sgstTotal + igstTotal;
      const status = invoiceStatus(index + week + seq, issueDate, dueDate);
      const invoiceNumber = `INV-${pad(invoiceCounter, 3)}`;
      invoiceCounter += 1;
      const note = NOTE_POOL[(index + week + seq) % NOTE_POOL.length];

      invoices.push({
        id: invoiceId,
        organizationId: orgId,
        customerId: customer.id,
        invoiceNumber,
        issueDate,
        dueDate,
        placeOfSupply: customer.stateCode,
        status,
        cancelRemark: status === "CANCELLED" ? "Order cancelled by customer before dispatch." : null,
        subTotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        discountTotal,
        total,
        notes: status === "CANCELLED" ? "Cancelled before payment collection." : note,
        customerDetails: `${customer.name} (${customer.email})`,
        billingAddress: customer.address,
        shippingAddress: customer.address,
        shippingName: customer.name,
        isAnomaly: false,
        anomalyReason: null,
        anomalyScore: null,
        createdAt: issueDate,
        updatedAt: issueDate,
      });

      if (status === "PAID" || status === "PARTIALLY_PAID") {
        const amount = status === "PAID" ? total : Math.round(total * 0.6);
        const paymentDate = addDays(issueDate, 2 + ((index + seq) % 8));
        payments.push({
          id: randomUuid(),
          invoiceId,
          amount,
          paymentDate,
          method: PAYMENT_METHODS[(index + seq + week) % PAYMENT_METHODS.length],
          notes: status === "PARTIALLY_PAID" ? "Advance payment received." : "Payment settled.",
          gatewayProvider: null,
          gatewayPaymentId: null,
          createdAt: paymentDate,
          updatedAt: paymentDate,
        });
      }
    }
  }

  return { user, organization, customers, products, invoices, items, payments };
}

async function wipeDatabase() {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;

  if (!tables.length) return;

  const quoted = tables.map((table) => `"public"."${table.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
}

async function insertChunk(bundles: OrgBundle[]) {
  await prisma.user.createMany({ data: bundles.map((bundle) => bundle.user) });
  await prisma.organization.createMany({ data: bundles.map((bundle) => bundle.organization) });
  await prisma.customer.createMany({
    data: bundles.flatMap((bundle) => bundle.customers),
  });
  await prisma.product.createMany({
    data: bundles.flatMap((bundle) => bundle.products),
  });
  await prisma.invoice.createMany({
    data: bundles.flatMap((bundle) => bundle.invoices),
  });
  await prisma.invoiceItem.createMany({
    data: bundles.flatMap((bundle) => bundle.items),
  });

  const paymentRows = bundles.flatMap((bundle) => bundle.payments);
  if (paymentRows.length) {
    await prisma.payment.createMany({ data: paymentRows });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run the seed.");
  }

  if (options.wipe) {
    console.log("Wiping existing public tables...");
    await wipeDatabase();
  } else {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 10) {
      throw new Error(`Refusing to seed without --wipe because ${existingUsers} users already exist.`);
    }
  }

  const passwordHash = await hash(DEMO_PASSWORD, 10);
  console.log(
    `Seeding ${options.users} users, ${options.weeks} weeks, about ${options.perWeek} invoices/week/org...`,
  );

  for (let start = 0; start < options.users; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, options.users);
    const bundles: OrgBundle[] = [];

    for (let index = start; index < end; index++) {
      bundles.push(makeBundle(index, options, passwordHash));
    }

    await insertChunk(bundles);

    const invoiceCount = bundles.reduce((sum, bundle) => sum + bundle.invoices.length, 0);
    console.log(`Inserted users ${start + 1}-${end} with ${invoiceCount} invoices`);
  }

  const [users, orgs, invoices] = await Promise.all([
    prisma.user.count(),
    prisma.organization.count(),
    prisma.invoice.count(),
  ]);
  console.log(`Done. Users=${users}, Organizations=${orgs}, Invoices=${invoices}`);
  console.log(`Demo login: demo@invoice.app / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
