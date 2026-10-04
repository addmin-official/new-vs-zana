import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import * as fs from "node:fs";

const serviceAccountPath = "./scripts/service-account.json";

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: scripts/service-account.json was not found.");
  console.error("Please place your Firebase service account private key at scripts/service-account.json");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: "gen-lang-client-0009572581",
});

async function setAdmin(uid: string, email: string) {
  await getAuth(app).setCustomUserClaims(uid, {
    admin: true,
    role: "SuperAdmin",
    permissions: ["*"],
  });
  console.log(`✅ Admin claim set for ${email} (${uid})`);
}

const uid = process.argv[2];
const email = process.argv[3];
if (!uid || !email) {
  console.error("Usage: npx tsx scripts/set-admin-claim.ts <UID> <EMAIL>");
  process.exit(1);
}

setAdmin(uid, email)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed to set admin claim:", err);
    process.exit(1);
  });
