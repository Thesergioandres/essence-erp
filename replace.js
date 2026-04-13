const fs = require("fs");
const path = require("path");

const repoPath = path.join(
  __dirname,
  "server/src/infrastructure/database/repositories/BusinessRepository.js",
);
let code = fs.readFileSync(repoPath, "utf8");

const oldCreate = `  async create(data, creatorId) {
    const exists = await Business.findOne({ name: data.name });
    if (exists) {
      const err = new Error("Ya existe un negocio con ese nombre");
      err.statusCode = 400;
      throw err;
    }

    const uniqueSlug = await this.generateUniqueSlug({
      desiredSlug: data.slug,
      fallbackName: data.name,
    });
    const landingTemplate = this.validateLandingTemplate(data.landingTemplate);

    const creatorUser = await User.findById(creatorId)
      .select("selectedPlan")
      .lean();
    const selectedPlan = creatorUser?.selectedPlan;
    const effectivePlan =
      data.plan ||
      (selectedPlan && ["starter", "pro", "enterprise"].includes(selectedPlan)
        ? selectedPlan
        : "starter");

    const business = await Business.create({
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl,
      logoPublicId: data.logoPublicId,
      slug: uniqueSlug,
      landingTemplate,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      contactWhatsapp: data.contactWhatsapp,
      contactLocation: data.contactLocation,
      config: { features: { ...(data.features || {}) } },
      createdBy: creatorId,
      plan: effectivePlan,
      customLimits: data.customLimits,
    });

    await Membership.create({
      user: creatorId,
      business: business._id,
      role: "admin",
      status: "active",
    });

    await User.findByIdAndUpdate(creatorId, {
      $addToSet: { businesses: business._id },
    });

    return business;
  }`;

const newCreate = `  async create(data, creatorId, options = {}) {
    const defaultRole = options.userRole === "god" || options.userRole === "super_admin" ? options.userRole : "admin";
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const exists = await Business.findOne({ name: data.name }).session(session);
      if (exists) {
        const err = new Error("Ya existe un negocio con ese nombre");
        err.statusCode = 400;
        throw err;
      }

      const uniqueSlug = await this.generateUniqueSlug({
        desiredSlug: data.slug,
        fallbackName: data.name,
      });
      const landingTemplate = this.validateLandingTemplate(data.landingTemplate);

      const creatorUser = await User.findById(creatorId)
        .select("selectedPlan")
        .session(session)
        .lean();
      const selectedPlan = creatorUser?.selectedPlan;
      const effectivePlan =
        data.plan ||
        (selectedPlan && ["starter", "pro", "enterprise"].includes(selectedPlan)
          ? selectedPlan
          : "starter");

      const [business] = await Business.create([{
        name: data.name,
        description: data.description,
        logoUrl: data.logoUrl,
        logoPublicId: data.logoPublicId,
        slug: uniqueSlug,
        landingTemplate,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactWhatsapp: data.contactWhatsapp,
        contactLocation: data.contactLocation,
        config: { features: { ...(data.features || {}) } },
        createdBy: creatorId,
        plan: effectivePlan,
        customLimits: data.customLimits,
      }], { session });

      await Membership.create([{
        user: creatorId,
        business: business._id,
        role: defaultRole,
        status: "active",
      }], { session });

      await User.findByIdAndUpdate(creatorId, {
        $addToSet: { businesses: business._id },
      }, { session });

      await session.commitTransaction();
      session.endSession();

      return business;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }`;

if (code.includes("async create(data, creatorId) {")) {
  code = code.replace(oldCreate, newCreate);
  fs.writeFileSync(repoPath, code, "utf8");
  console.log("BusinessRepository create method updated with transaction!");
} else {
  console.log(
    "Could not find the create method signature in BusinessRepository.js",
  );
}
