# RAG Generative AI Project

This project is a backend API that leverages MongoDB Atlas, Node.js, OpenAI, and
LlamaIndex to implement a retrieval-augmented generation (RAG) model for image
analysis. The API allows users to upload images, populate a MongoDB database,
and create embeddings for improved search and retrieval in a Generative AI
setup.

## Table of Contents

-   [Features](#features)
-   [Technologies Used](#technologies-used)
-   [Getting Started](#getting-started)
-   [Environment Variables](#environment-variables)
-   [Endpoints](#endpoints)
-   [Usage](#usage)
-   [Dataset](#dataset)
-   [License](#license)

## Features

-   **Database Population**: Populate the MongoDB database with data for the RAG
    model.
-   **Embeddings Creation**: Generate embeddings for efficient data retrieval
    and integration with OpenAI.
-   **Image Analysis**: Analyze images based on user skin types.

## Technologies Used

-   **Express**: Web application framework for NodeJS
-   **MongoDB Atlas**: Cloud database to store the raw and vector data
-   **OpenAI API**: For generating embeddings and other generative AI tasks
-   **LlamaIndex**: To handle data indexing and retrieval, aiding the RAG model

## Getting Started

To get the project up and running, follow these steps:

### Prerequisites

-   [Node.js](https://nodejs.org/) (v14+)
-   MongoDB Atlas account
-   OpenAI API Key
-   LlamaIndex setup (follow LlamaIndex documentation if required)

### Installation

1. Clone the repository:

    ```bash
    git clone git@github.com:brunaclacerda/GenAI-Lab.git
    cd GenAI-Lab/rag-engine
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables (see below).

4. Start the server:
    ```bash
    npm start
    ```

## Environment Variables

Rename the file `/config/.example.env` to `.env`, and configure your environment
variables.

## Endpoints

### `/upload-data`

-   **Method**: `POST`
-   **Description**: Populates the MongoDB database with data required for the
    RAG model.

### `/generate-embeddings`

-   **Method**: `POST`
-   **Description**: Creates embeddings for the data in the database to support
    efficient search and retrieval for the RAG model.

### `/image-analysis`

-   **Method**: `POST`
-   **Description**: Accepts an uploaded image file containing a photo of a
    skincare product's ingredient list. Analyzes the ingredients in the image
    based on the specified skin type. An example image can be found at
    `/data/product.png`.
-   **Request Body**:
    -   `image` (file): The image file containing the ingredient list.
    -   `skinType` (optional, string): The user's skin type (e.g., `"oily"`).
        Defaults to `"oily"` if not specified.
-   **Response**: Returns analysis results for the uploaded ingredient list.

## Usage

To use the API, follow these steps:

1. **Start the Server**  
   Start the server using the command below. Ensure MongoDB Atlas, OpenAI, and
   LlamaIndex are configured as described in the
   [Environment Variables](#environment-variables) section.

    ```bash
    npm start
    ```

## Usage

To use the API, follow these steps:

1.  **Start the Server**  
    Start the server using the command below. Ensure MongoDB Atlas, OpenAI, and
    LlamaIndex are configured as described in the
    [Environment Variables](#environment-variables) section.

    ```bash
    npm start

    ```

2.  **Populate the Database** Initialize or refresh the MongoDB database with
    necessary data for the RAG model by sending a POST request to /upload-data.

        Endpoint: /upload-data
        Method: POST

3.  **Generate Embeddings** To create embeddings for data retrieval, send a POST
    request to the /generate-embeddings endpoint. This step is required to
    support the RAG model's efficient data retrieval.

        Endpoint: /generate-embeddings
        Method: POST

4.  **Upload an Image for Analysis** Send a POST request to the /image-analysis
    endpoint. This endpoint accepts an image file containing the ingredient list
    of a skincare product and analyzes it based on the specified skin type.
    Endpoint: /image-analysis Method: POST Request: image (file): The ingredient
    list image. skinType (optional, string): Specify the user’s skin type (e.g.,
    "dry", "oily"). Defaults to "oily" if not provided.

## Dataset

This project uses a dataset sourced from [Kaggle](https://www.kaggle.com/).
Please ensure you have access to Kaggle datasets and adhere to their licensing
agreements when using or modifying this data.

## License

### MIT License

Copyright (c) [2024]

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
