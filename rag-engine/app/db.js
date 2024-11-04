import { MongoClient, ServerApiVersion } from "mongodb";

// Replace the placeholder with your Atlas connection string
const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		deprecationErrors: true,
	},
});

async function test() {
	try {
		await client.connect();

		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
	} finally {
		await client.close();
	}
}
test().catch(console.error);

export function getClient() {
	return client;
}

export const DB_NAME = "rag_engine";
