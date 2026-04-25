import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  BANK_DOCUMENTS_BUCKET,
  deleteBankTransaction,
  updateBankTransaction,
} from "@/modules/banco/db";
import { validateBankTransactionInput } from "@/modules/banco/validation";

type Params = {
  params: Promise<{ id: string }>;
};

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
}

export async function PATCH(request: Request, context: Params) {
  try {
    const { id } = await context.params;
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

    const removeFile = formData.get("remove_file") === "true";
    const file = formData.get("file");

    let fileUpdate:
      | { mode: "keep" }
      | { mode: "remove" }
      | {
          mode: "replace";
          file_name: string;
          file_path: string;
          file_mime_type: string;
          file_size: number;
        } = removeFile ? { mode: "remove" } : { mode: "keep" };

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

      fileUpdate = {
        mode: "replace",
        file_name: file.name,
        file_path: filePath,
        file_mime_type: file.type || "application/octet-stream",
        file_size: file.size,
      };
    }

    const transaction = await updateBankTransaction(id, result.data, fileUpdate);
    return NextResponse.json({ transaction }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo actualizar la transaccion.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Params) {
  try {
    const { id } = await context.params;
    await deleteBankTransaction(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo eliminar la transaccion.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
