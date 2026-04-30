import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HEALTH_INBODY_FILES_BUCKET } from "@/modules/salud/db";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Params) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No hay una sesion activa." }, { status: 401 });
  }

  const { data: scan, error } = await supabase
    .from("health_inbody_scans")
    .select("file_name, file_path, file_mime_type")
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!scan) {
    return NextResponse.json({ error: "Escaneo InBody no encontrado." }, { status: 404 });
  }

  if (!scan.file_path) {
    return NextResponse.json({ error: "Este escaneo no tiene archivo asociado." }, { status: 404 });
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from(HEALTH_INBODY_FILES_BUCKET)
    .download(scan.file_path);

  if (downloadError) {
    return NextResponse.json({ error: downloadError.message }, { status: 400 });
  }

  const headers = new Headers();
  headers.set("Content-Type", scan.file_mime_type || fileData.type || "application/octet-stream");

  if (scan.file_name) {
    headers.set("Content-Disposition", `attachment; filename="${scan.file_name}"`);
  }

  return new Response(fileData, { headers });
}
