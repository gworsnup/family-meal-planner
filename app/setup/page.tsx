import { prisma } from "@/lib/db";
import { hashPasscode } from "@/lib/auth";

function randomSlug() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default async function SetupPage() {
  const existing = await prisma.workspace.findFirst();

  const slug = existing?.slug ?? randomSlug();
  const passcode = "1234"; // TEMP: we'll change this after confirming it works
  const passcodeHash = await hashPasscode(passcode);

  const workspace = await prisma.workspace.upsert({
    where: { slug },
    update: { passcodeHash },
    create: { slug, name: "Household", passcodeHash },
  });

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1>Workspace ready</h1>
      <p>
        Link: <a href={`/g/${workspace.slug}`}>{`/g/${workspace.slug}`}</a>
      </p>
      <p>
        Temporary passcode: <strong>{passcode}</strong>
      </p>
      <p style={{ marginTop: 16 }}>
        Next: once confirmed working, we’ll change the passcode and remove/lock this /setup page.
      </p>
    </div>
  );
}
