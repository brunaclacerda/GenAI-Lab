import fs from "fs";
import { getClient, DB_NAME } from "./db.js";
import {
	MongoDBAtlasVectorSearch,
	storageContextFromDefaults,
	Settings,
	OpenAIEmbedding,
	VectorStoreIndex,
	SimpleMongoReader,
	RetrieverQueryEngine,
	OpenAI,
	QueryEngineTool,
	OpenAIAgent,
} from "llamaindex";

const openai = new OpenAI({
	apiKey: process.env["OPENAI_API_KEY"],
});

const mongoClient = getClient();
const COS_COLLECTION = "cos_ingredients";
const VECTOR_COLLECTION = "vector_data";
const VECTOR_STORE = new MongoDBAtlasVectorSearch({
	mongodbClient: mongoClient,
	dbName: DB_NAME,
	collectionName: VECTOR_COLLECTION,
});

Settings.llm = openai;
Settings.embed_model = new OpenAIEmbedding("text-embedding-ada-002");
Settings.chunk_size = 100;
Settings.chunk_overlap = 10;

const loadData = async () => {
	console.log("Loading data");
	const FIELDS_NAME = [
		"cosing_number",
		"description",
		"inci_name",
		"function",
	];
	const SEPARATOR = ",";
	const FILTER_QUERY = {};
	const MAX_DOCS = 0;
	const METADATA_NAMES = ["inci_name", "cosing_number"];

	try {
		const reader = new SimpleMongoReader(mongoClient);
		const data = await reader.loadData(
			DB_NAME,
			COS_COLLECTION,
			FIELDS_NAME,
			SEPARATOR,
			FILTER_QUERY,
			MAX_DOCS,
			METADATA_NAMES
		);
		return data;
	} catch (error) {
		throw new Error("Error loading data: " + error.message);
	}
};

const createStorageContext = async () => {
	console.log("Creating storage context");
	try {
		const storageContext = await storageContextFromDefaults({
			vectorStore: VECTOR_STORE,
		});
		return storageContext;
	} catch (error) {
		throw new Error("Error creating storage context: " + error.message);
	}
};

const createAtlasIndex = async () => {
	const collection = mongoClient.db(DB_NAME).collection(VECTOR_COLLECTION);
	const INDEX_NAME = "vector_index";
	const index = {
		name: INDEX_NAME,
		type: "vectorSearch",
		definition: {
			fields: [
				{
					type: "vector",
					path: "embedding",
					numDimensions: 1536,
					similarity: "cosine",
				},
				{
					type: "filter",
					path: "metadata.inci_name",
				},
			],
		},
	};

	try {
		const listSearchIndexes = await collection
			.listSearchIndexes()
			.toArray();
		const isCreated = listSearchIndexes.some(
			(index) => index.name === INDEX_NAME
		);
		if (isCreated) {
			console.log("Atlas index exists already.");
			return;
		}

		console.log("Creating Atlas vector index.");
		const result = await collection.createSearchIndex(index);
		console.log(`New search index named ${result} is building.`);
	} catch (error) {
		throw new Error("Error creating Atlas vector index: " + error.message);
	}
};

export async function createEmbeddings() {
	try {
		await mongoClient.connect();
		// Load data
		const data = await loadData();
		// Instantiate the vector store
		const storageContext = await createStorageContext();
		//Store data as vector embeddings
		console.log("Creating indexes");
		const vectorStoreIndex = await VectorStoreIndex.fromDocuments(data, {
			storageContext,
			logProgress: true,
		});
		console.log("Indexes created.");

		//Create the Atlas Vector Search Index
		await createAtlasIndex();
	} catch (error) {
		throw error;
	} finally {
		await mongoClient.close();
	}
}

const queryDatabase = async (list) => {
	//text search
	console.log("Query engine with Tool");
	const vectorStoreIndex = await VectorStoreIndex.fromVectorStore(
		VECTOR_STORE
	);
	const retriever = vectorStoreIndex.asRetriever({ similarityTopK: 2 });

	const queryEngine = vectorStoreIndex.asQueryEngine({ retriever });
	const tools = [
		new QueryEngineTool({
			queryEngine: queryEngine,
			metadata: {
				name: "skincare_ingredients_database_tool",
				description: `This tool can consult a skincare ingredients database.`,
			},
		}),
	];

	// Create an agent using the tools array
	const agent = new OpenAIAgent({
		tools,
		llm: new OpenAI({
			additionalChatOptions: { response_format: { type: "json_object" } },
		}),
	});

	try {
		await mongoClient.connect();
		const response = await agent.chat({
			message: `You are a helpful skincare coach. Based on context explain to the user the function, pros and cons of the given ingredients list.
                      Do not use your knowledge to answer the user. Always consult the database. If a ingredient is not found inform that to the user.
                      
                      JSON structure example:
                      "ingredients": [
                        {
                            "name": "Cellulose Gum",
                            "function": "Increases or decreases the viscosity of cosmetic products",
                            "pros": "Thickens and stabilizes formulations.",
                            "cons": "Generally safe, but can cause a sticky feeling."
                        },

                        {
                            "name": "Phenoxyethanol*",
                            "error": "Ingredient not found on the database."
                        },
                      ]  

                      If water is listed do not consult in the database, just inform the pros: 
                        "Acts as a solvent to dissolve other ingredients, hydrates the skin."

                      Ingredients's list: ${JSON.stringify(list)}  `,
		});
		console.log(response);
		return response?.message?.content;
	} catch (error) {
		console.log(error);
	} finally {
		await mongoClient.close();
	}
};

const getImgAnalysis = async (data, user) => {
	const messages = [
		{
			role: "system",
			content: `You are a helpful skincare coach. Based on the context given explain in few words to the user the benefits (or absence of them) 
                     she/he can gain using the product with the ingredients informed.

                      The product Ingredients' data: ${data}  `,
		},
		{
			role: "user",
			content: `
                       Do you recommend me using this product good for my ${user.skinType} skin?
                      `,
		},
	];
	try {
		const result = await new OpenAI({ model: "gpt-4o-mini" }).chat({
			messages,
		});

		return result;
	} catch (error) {
		throw new Error("Error analysing: " + error.message);
	}
};

const imageToText = async (img) => {
	const base64Image = img.toString("base64");
	const messages = [
		{
			role: "system",
			content: `Parse the image of a product ingredients's list to text uploaded by the user . 
				      Just answer with the ingredients' name separeted by comma. 
                      Exemple of the JSON with success result:
                        {
                            "success": "true",
                            "list": ["Neroli Hydrosol, Lactobacillus, Selaginella Extract, Coco-Glucoside, Xanthan Gum, Aspen Bark Extract, Aloe Vera Extract, Neroli Essential Oil"]
                        }
                      If the image uploaded does not list ingredients answer inform the user that the image is invalid.
                      Example of the JSON for failure:
                        {
                            "success": "false",
                            "message": "The image is not valid for listing ingredients.",
                        }
                      `,
		},
		{
			role: "user",
			content: [
				{
					type: "image_url",
					image_url: {
						url: `data:image/jpeg;base64,${base64Image}`, // Including Base64 image
					},
				},
			],
		},
	];

	try {
		const rawResult = await new OpenAI().chat({
			messages,
			additionalChatOptions: { response_format: { type: "json_object" } },
		});

		const structResult = JSON.parse(rawResult?.message?.content);

		if (structResult.success && structResult.list) {
			return structResult.list;
		}
		throw new Error(structResult.message);
	} catch (error) {
		throw new Error("Failed to process image: " + error.message);
	}
};

export async function uploadImage(img, user) {
	//image agent
	const list = await imageToText(img);
	//query with context
	const data = await queryDatabase(list);
	//chat completation
	const result = await getImgAnalysis(data, user);
	return result;
}

export async function uploadData() {
	try {
		await mongoClient.connect();
		const jsonFilePath = "./data/skincare-cos-ingredients.json";

		const data = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
		const documents = Array.isArray(data) ? data : [data];

		const collection = mongoClient.db(DB_NAME).collection(COS_COLLECTION);

		// Insert the documents to MongoDB
		const result = await collection.insertMany(documents);
		console.log(`${result.insertedCount} documents were inserted`);
	} catch (error) {
		console.error(error.message);
	} finally {
		await mongoClient.close();
	}
}
