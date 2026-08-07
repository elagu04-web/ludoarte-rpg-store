import { createClient } from "@supabase/supabase-js";

// Crea un PNG de relleno en public/assets/boardgames/{slug}.png dentro del
// repositorio de GitHub, usando la API de Contenidos, para que el admin
// tenga el nombre de archivo exacto ya reservado y lo pueda reemplazar
// mas tarde arrastrando la foto real con ese mismo nombre.
//
// GITHUB_TOKEN es un secreto de servidor (nunca NEXT_PUBLIC_*): un fine-
// grained personal access token de GitHub, con acceso limitado a este
// unico repositorio y permiso solo de "Contents: Read and write". Se
// configura en Vercel -> Settings -> Environment Variables.
//
// Solo elagu04@gmail.com puede disparar esto -- se verifica el token de
// sesion de Supabase que manda el cliente contra Supabase mismo (no se
// confia en nada que mande el cliente aparte de ese token).

const OWNER = "elagu04-web";
const REPO = "ludoarte-rpg-store";
const BRANCH = "main";
const ADMIN_EMAIL = "elagu04@gmail.com";

// Mismo formato que produce slugify() en data/customGames.ts -- sin esto
// alguien podria mandar un "slug" con "../" y escribir fuera de la
// carpeta de imagenes.
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// PNG 300x300 gris oscuro con el texto "Falta foto del juego" -- generado
// una sola vez, no es una foto de ningun juego real.
const PLACEHOLDER_PNG_BASE64 =
  "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";

function isAuthorizedRequest(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}

export async function POST(request: Request) {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return Response.json({ error: "GITHUB_TOKEN no configurado" }, { status: 500 });
  }

  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!accessToken) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !isAuthorizedRequest(userData.user?.email)) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo invalido" }, { status: 400 });
  }
  const slug = (body as { slug?: unknown })?.slug;
  if (typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
    return Response.json({ error: "Nombre de archivo invalido" }, { status: 400 });
  }

  const filePath = `public/assets/boardgames/${slug}.png`;
  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`;
  const githubHeaders = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Si ya hay un archivo con ese nombre (por ejemplo una foto real subida
  // a mano), no lo pisamos.
  const existing = await fetch(`${apiUrl}?ref=${BRANCH}`, { headers: githubHeaders });
  if (existing.ok) {
    return Response.json({ ok: true, skipped: true });
  }
  if (existing.status !== 404) {
    const detail = await existing.text();
    return Response.json({ error: `GitHub (check): ${detail}` }, { status: 502 });
  }

  const putRes = await fetch(apiUrl, {
    method: "PUT",
    headers: { ...githubHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `Imagen de relleno para ${slug}`,
      content: PLACEHOLDER_PNG_BASE64,
      branch: BRANCH,
    }),
  });

  if (!putRes.ok) {
    const detail = await putRes.text();
    return Response.json({ error: `GitHub: ${detail}` }, { status: 502 });
  }

  return Response.json({ ok: true });
}
