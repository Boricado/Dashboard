import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BANK_DOCUMENTS_BUCKET, createBankTransaction } from "@/modules/banco/db";
import { validateBankTransactionInput } from "@/modules/banco/validation";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const payload = {
      transaction_date: formData.get("transaction_date"),
      type: formData.get("type"),
      category: formData.get("category"),
      provider: formData.get("provider"),
      description: formData.get("description"),
      document_number: formData.get("document_number"),
      net_amount: formData.get("net_amount"),
      vat_amount: formData.get("vat_amount"),
      total_amount: formData.get("total_amount"),
      notes: formData.get("notes"),
    };

    const result = validateBankTransactionInput(payload);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const file = formData.get("file");
    let uploadData:
      | {
          file_name: string;
          file_path: string;
          file_mime_type: string;
          file_size: number;
        }
      | undefined;

    if (file instanceof File && file.size > 0) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "No hay una sesion activa." }, { status: 401 });
      }

      const safeName = sanitizeFileName(file.name);
      const filePath = `${user.id}/${Date.now()}-${safeName}`;
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from(BANK_DOCUMENTS_BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          {
            error:
              uploadError.message ||
              "No se pudo subir el archivo. Revisa el bucket bank-documents en Supabase.",
          },
          { status: 400 },
        );
      }

      uploadData = {
        file_name: file.name,
        file_path: filePath,
        file_mime_type: file.type || "application/octet-stream",
        file_size: file.size,
      };
    }

    const transaction = await createBankTransaction({
      ...result.data,
      ...uploadData,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo registrar la transaccion.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
