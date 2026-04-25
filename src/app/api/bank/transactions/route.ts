import { NextResponse } from "next/server";
import { createBankTransaction } from "@/modules/banco/db";
import { validateBankTransactionInput } from "@/modules/banco/validation";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = validateBankTransactionInput(payload);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const transaction = await createBankTransaction(result.data);
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo registrar la transaccion.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
