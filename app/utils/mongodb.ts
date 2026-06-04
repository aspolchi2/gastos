import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI no está definida en las variables de entorno");
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Fallamos rápido ante un hipo de red/DNS en vez de colgarnos ~30s con los
  // defaults; el driver reintenta lecturas y escrituras por su cuenta.
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  retryReads: true,
  retryWrites: true,
};

// Conecta reintentando ante fallos transitorios (p. ej. querySrv ETIMEOUT del
// lookup SRV de Atlas). Sin esto, un único hipo de DNS al arrancar dejaba la
// promesa cacheada en estado rechazado y todo fallaba hasta reiniciar.
async function connectWithRetry(retries = 3, delayMs = 1000): Promise<MongoClient> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new MongoClient(uri!, options).connect();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = globalThis as unknown as {
    _mongoClientPromise?: Promise<MongoClient>;
  };
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = connectWithRetry();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  clientPromise = connectWithRetry();
}

export default clientPromise;
