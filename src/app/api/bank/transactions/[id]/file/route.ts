import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BANK_DOCUMENTS_BUCKET } from "@/modules/banco/db";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Params) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No hay una sesion activa." }, { status: 401 });
  }

  const { data: transaction, error } = await supabase
    .from("bank_transactions")
    .select("file_name, file_path, file_mime_type")
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!transaction) {
    return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  }

  if (transaction.file_path) {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BANK_DOCUMENTS_BUCKET)
      .download(transaction.file_path);

    if (downloadError) {
      return NextResponse.json({ error: downloadError.message }, { status: 400 });
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      transaction.file_mime_type || fileData.type || "application/octet-stream",
    );

    if (transaction.file_name) {
      headers.set("Content-Disposition", `inline; filename="${transaction.file_name}"`);
    }

    return new Response(fileData, { headers });
  }

  if (transaction.file_name) {
    return NextResponse.redirect(
      new URL(`/facturas/banco/${encodeURIComponent(transaction.file_name)}`, request.url),
    );
  }

  return NextResponse.json({ error: "La transaccion no tiene archivo." }, { status: 404 });
}
