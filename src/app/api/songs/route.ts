import { readdirSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const SONGS_DIR = path.join(process.cwd(), "public", "assets", "game songs");
const AUDIO_EXTENSIONS = new Set([".mp3", ".ogg", ".wav", ".m4a"]);

export async function GET() {
  let files: string[] = [];
  try {
    files = readdirSync(SONGS_DIR).filter((file) =>
      AUDIO_EXTENSIONS.has(path.extname(file).toLowerCase())
    );
  } catch {
    files = [];
  }

  const songs = files.sort().map((file) => `/assets/game songs/${file}`);
  return Response.json({ songs });
}
