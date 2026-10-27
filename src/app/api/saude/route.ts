// Healthcheck da stack (infra/docker-compose.yml): só confirma que o servidor do Next responde.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
