import { readdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const PHOTOS_DIR = path.join(process.cwd(), "public", "assets", "fotos");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

export async function GET() {
  let files: string[] = [];
  try {
    files = readdirSync(PHOTOS_DIR).filter((file) =>
      IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())
    );
  } catch {
    files = [];
  }

  const photos = files.sort().map((file) => `/assets/fotos/${file}`);
  return Response.json({ photos });
}
