import type { PushSubscription } from "web-push";
import { auth } from "@/auth";
import { saveSubscription, deleteSubscription } from "@/app/utils/push";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let subscription: PushSubscription;
  try {
    subscription = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!subscription?.endpoint) {
    return Response.json(
      { ok: false, error: "Suscripción inválida" },
      { status: 400 },
    );
  }

  await saveSubscription(session.user.email, subscription);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!body.endpoint) {
    return Response.json(
      { ok: false, error: "Falta endpoint" },
      { status: 400 },
    );
  }

  await deleteSubscription(body.endpoint);
  return Response.json({ ok: true });
}
