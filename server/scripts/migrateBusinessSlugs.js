import dotenv from "dotenv";
import mongoose from "mongoose";
import Business from "../src/infrastructure/database/models/Business.js";

dotenv.config();

const VALID_TEMPLATES = new Set(["modern", "minimal", "bold"]);
const MAX_SLUG_LENGTH = 80;

const normalizeSlug = (rawValue = "") =>
  String(rawValue || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);

const buildSlugCandidate = (baseSlug, counter = 1) => {
  const suffix = counter > 1 ? `-${counter}` : "";
  const maxBaseLength = Math.max(1, MAX_SLUG_LENGTH - suffix.length);
  const safeBase =
    baseSlug.slice(0, maxBaseLength).replace(/-+$/g, "") || "negocio";
  return `${safeBase}${suffix}`;
};

const resolveMongoUri = () =>
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGO_PUBLIC_URL ||
  process.env.MONGO_URL ||
  process.env.MONGO_URI_DEV;

const resolveDbName = (mongoUri) => {
  const explicitDbName =
    process.env.MONGO_DB_NAME || process.env.MONGODB_DB_NAME;

  if (explicitDbName) {
    return explicitDbName;
  }

  try {
    const parsed = new URL(mongoUri);
    const dbNameFromPath = (parsed.pathname || "").replace(/^\/+/, "");
    if (dbNameFromPath) {
      return dbNameFromPath;
    }
  } catch {
    // noop
  }

  return process.env.NODE_ENV === "test" ? "essence_test" : "essence";
};

const run = async () => {
  const mongoUri = resolveMongoUri();

  if (!mongoUri) {
    console.error("Missing MongoDB URI (MONGODB_URI/MONGO_URI/MONGO_URI_DEV)");
    process.exit(1);
  }

  const dbName = resolveDbName(mongoUri);
  await mongoose.connect(mongoUri, { dbName });
  console.log(`Connected to database: ${dbName}`);

  try {
    const businesses = await Business.find({})
      .select("_id name slug landingTemplate")
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    const usedSlugs = new Set();
    let updatedCount = 0;

    for (const business of businesses) {
      const baseSlug = normalizeSlug(
        business.slug || business.name || "negocio",
      );
      let counter = 1;
      let candidate = buildSlugCandidate(baseSlug || "negocio", counter);

      while (usedSlugs.has(candidate)) {
        counter += 1;
        candidate = buildSlugCandidate(baseSlug || "negocio", counter);
      }

      usedSlugs.add(candidate);

      const normalizedTemplate = VALID_TEMPLATES.has(business.landingTemplate)
        ? business.landingTemplate
        : "modern";

      const shouldUpdateSlug = business.slug !== candidate;
      const shouldUpdateTemplate =
        business.landingTemplate !== normalizedTemplate;

      if (!shouldUpdateSlug && !shouldUpdateTemplate) {
        continue;
      }

      const updateData = {
        ...(shouldUpdateSlug ? { slug: candidate } : {}),
        ...(shouldUpdateTemplate
          ? { landingTemplate: normalizedTemplate }
          : {}),
      };

      await Business.updateOne({ _id: business._id }, { $set: updateData });
      updatedCount += 1;
      console.log(`Updated business ${business._id}:`, updateData);
    }

    console.log(`Migration completed. Businesses updated: ${updatedCount}`);
  } finally {
    await mongoose.connection.close();
  }
};

run().catch(async (error) => {
  console.error("Migration failed:", error);
  try {
    await mongoose.connection.close();
  } catch {
    // noop
  }
  process.exit(1);
});
