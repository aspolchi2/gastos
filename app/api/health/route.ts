import clientPromise from "@/app/utils/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const result = await client.db("admin").command({ ping: 1 });
    return Response.json({ ok: true, ping: result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
