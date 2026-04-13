const fs = require("fs");
const path = require("path");

const repoPath = path.join(
  __dirname,
  "server/src/infrastructure/database/repositories/BusinessRepository.js",
);
let code = fs.readFileSync(repoPath, "utf8");

// replace the properRole logic
code = code.replace(
  'const defaultRole = options.userRole === "god" || options.userRole === "super_admin" ? options.userRole : "admin";',
  'const defaultRole = "admin";',
);

fs.writeFileSync(repoPath, code, "utf8");
console.log(
  "Reverted defaultRole to 'admin' because Membership enum restricts it.",
);
