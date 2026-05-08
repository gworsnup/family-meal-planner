from pathlib import Path
import re

OUTPUT = Path("output/pdf/family-meal-planner-summary.pdf")
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W = 612  # Letter
PAGE_H = 792
LEFT = 54
TOP = 742
BOTTOM = 54

sections = [
    ("Family Meal Planner - App Summary", [
        "Repository evidence snapshot",
    ], "title"),
    ("What it is", [
        "A Next.js web app called FamilyTable for shared household meal planning and shopping.",
        "It lets users import recipes from TikTok, Instagram, and websites, then plan meals and generate shopping lists.",
    ], "normal"),
    ("Who it is for", [
        "Primary persona: household members planning meals and shopping together (inferred from onboarding and UI copy).",
    ], "normal"),
    ("What it does", [
        "Recipe library with search/sort/filter, ratings, tags, and recipe editing.",
        "Recipe import pipeline from URL with JSON-LD/HTML parsing and Playwright fallback when needed.",
        "Social-caption parsing for Instagram/TikTok recipes, with optional OpenAI extraction.",
        "Week/month meal planner with recipe entries plus takeaway nights.",
        "Template support for reusable meal plans (weekly/monthly).",
        "Shopping-list builder from planned meals, plus Smart List normalization and merge jobs.",
        "Multi-workspace auth flow with admin workspace/user management and optional Google OAuth.",
    ], "bullets"),
    ("How it works (repo evidence)", [
        "UI: Next.js App Router pages under app/, with server/client components and Server Actions.",
        "Data: Prisma ORM to PostgreSQL (workspace, user/session, recipes, plan items, shopping list, smart list jobs).",
        "Auth: cookie sessions and password login in lib/auth.ts; Google OAuth routes under app/auth/google/.",
        "Import flow: app/api/import/* triggers lib/scrape/runRecipeImport.ts and lib/scrape/scrapeUrl.ts.",
        "Smart list flow: app/api/smart-lists/generate queues jobs; app/api/smart-lists/run executes normalization.",
        "Integrations: OpenAI Responses API for caption/smart-list parsing and Vercel Blob for social image persistence.",
        "Background worker service: Not found in repo (jobs are kicked off via internal API fetch).",
    ], "bullets"),
    ("How to run (minimal)", [
        "1. Install deps: pnpm install",
        "2. Set env vars at minimum: DATABASE_URL (required); OPENAI_API_KEY and BLOB_READ_WRITE_TOKEN are optional features.",
        "3. Prepare DB schema: pnpm prisma migrate deploy (or local equivalent).",
        "4. Start app: pnpm dev",
        "5. Open http://localhost:3000",
        "Initial database provisioning instructions and sample env file for this app: Not found in repo.",
    ], "normal"),
]


def esc(text: str) -> str:
    return text.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')

ops = []
y = TOP

def need_space(lines: int, line_height: int) -> None:
    global y
    projected = y - (lines * line_height)
    if projected < BOTTOM:
        raise RuntimeError("Content overflow: does not fit on one page")

for heading, body, kind in sections:
    if kind == "title":
        need_space(2 + len(body), 15)
        ops.append("BT /F1 18 Tf %.2f %.2f Td (%s) Tj ET" % (LEFT, y, esc(heading)))
        y -= 18
        for line in body:
            ops.append("BT /F1 9 Tf %.2f %.2f Td (%s) Tj ET" % (LEFT, y, esc(line)))
            y -= 13
        y -= 6
        continue

    need_space(1, 14)
    ops.append("BT /F1 13 Tf %.2f %.2f Td (%s) Tj ET" % (LEFT, y, esc(heading)))
    y -= 15

    if kind == "bullets":
        for line in body:
            need_space(1, 12)
            ops.append("BT /F1 10 Tf %.2f %.2f Td (%s) Tj ET" % (LEFT + 8, y, esc("- " + line)))
            y -= 12
    else:
        for line in body:
            need_space(1, 12)
            ops.append("BT /F1 10 Tf %.2f %.2f Td (%s) Tj ET" % (LEFT, y, esc(line)))
            y -= 12

    y -= 6

stream = "\n".join(ops).encode("latin-1", "replace")

objects = []
objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
objects.append(
    f"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n".encode("ascii")
)
objects.append(b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")
objects.append(b"5 0 obj << /Length " + str(len(stream)).encode("ascii") + b" >> stream\n" + stream + b"\nendstream endobj\n")

pdf = bytearray()
pdf.extend(b"%PDF-1.4\n")
offsets = [0]
for obj in objects:
    offsets.append(len(pdf))
    pdf.extend(obj)

xref_pos = len(pdf)
pdf.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
pdf.extend(b"0000000000 65535 f \n")
for off in offsets[1:]:
    pdf.extend(f"{off:010d} 00000 n \n".encode("ascii"))

pdf.extend(
    f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii")
)

OUTPUT.write_bytes(pdf)

# Minimal integrity check: exactly one page object marker
content = OUTPUT.read_bytes().decode("latin-1", "ignore")
page_markers = len(re.findall(r"/Type /Page\b", content))
if page_markers != 1:
    raise RuntimeError(f"Unexpected page count marker: {page_markers}")

print(str(OUTPUT.resolve()))
