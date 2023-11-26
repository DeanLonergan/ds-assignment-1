import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBDocumentClient, ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import * as AWS from 'aws-sdk';
import { Review } from "../shared/types";

const ddbDocClient = createDdbDocClient();
const translate = new AWS.Translate(); // Initialize AWS Translate outside the handler

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    const parameters = event.pathParameters;
    const queryParams = event.queryStringParameters;
    const reviewerName = parameters?.reviewerName;
    const movieId = parameters?.movieId ? parseInt(parameters?.movieId) : undefined;
    const language = queryParams?.language;

    if (!reviewerName || !movieId || !language) {
        return {
            statusCode: 400,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ message: "Missing required parameters" })
        };
    }

    try {
        const command: ScanCommandInput = {
            TableName: process.env.TABLE_NAME,
            FilterExpression: "movieId = :m and reviewerName = :r",
            ExpressionAttributeValues: {
                ":m": movieId,
                ":r": reviewerName
            }
        };

        const commandOutput = await ddbDocClient.send(
            new ScanCommand(command)
        );

        const json = JSON.stringify(commandOutput.Items);
        const data = JSON.parse(json) as Review[];

        const promises: Promise<Review>[] = data.map(async e => {
            const translatedText = await translateText(e.content, language);
            e.content = translatedText;
            return e;
        });

        const translatedData = await Promise.all(promises);

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                data: translatedData
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ error: error.message })
        };
    }
}

async function translateText(text: string, targetLanguage: string): Promise<string> {
    const params = {
        SourceLanguageCode: "en",
        TargetLanguageCode: targetLanguage,
        Text: text,
    };

    const result = await translate.translateText(params).promise();
    return result.TranslatedText;
}

function createDdbDocClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
        wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}