import webpush, { type PushSubscription } from "web-push";
import clientPromise from "@/app/utils/mongodb";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@gastos.app";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export type StoredSubscription = {
  userEmail: string;
  subscription: PushSubscription;
};

function subscriptionsCollection() {
  return clientPromise.then((client) =>
    client.db("gastos").collection<StoredSubscription>("pushSubscriptions"),
  );
}

export async function saveSubscription(
  userEmail: string,
  subscription: PushSubscription,
) {
  const col = await subscriptionsCollection();
  await col.updateOne(
    { "subscription.endpoint": subscription.endpoint },
    { $set: { userEmail, subscription } },
    { upsert: true },
  );
}

export async function deleteSubscription(endpoint: string) {
  const col = await subscriptionsCollection();
  await col.deleteOne({ "subscription.endpoint": endpoint });
}

/**
 * Envía una notificación a todos los usuarios cuyo email NO sea `exceptEmail`
 * (el que generó el evento). Limpia suscripciones vencidas (404/410).
 */
export async function notifyOthers(
  exceptEmail: string,
  payload: { title: string; body: string; url?: string },
) {
  if (!publicKey || !privateKey) return;

  const col = await subscriptionsCollection();
  const subs = await col
    .find({ userEmail: { $ne: exceptEmail } })
    .toArray();

  const data = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (doc) => {
      try {
        await webpush.sendNotification(doc.subscription, data);
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await col.deleteOne({ _id: doc._id });
        }
      }
    }),
  );
}
