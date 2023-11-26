import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Review } from "../shared/types"; // Import the Review type

const ddbDocClient = createDdbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        console.log("Event: ", event);

        const reviewerName = event.pathParameters?.reviewerName;
        const year = event.pathParameters?.year; // Extract the year from the path

        if (!reviewerName || !year) {
            return {
                statusCode: 400,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ message: "Reviewer name or year is missing in the path" }),
            };
        }

        const commandOutput = await ddbDocClient.send(
            new QueryCommand({
                TableName: process.env.TABLE_NAME,
                KeyConditionExpression: "#reviewerName = :reviewerName AND begins_with(reviewDate, :year)",
                ExpressionAttributeNames: {
                    "#reviewerName": "reviewerName",
                },
                ExpressionAttributeValues: {
                    ":reviewerName": reviewerName,
                    ":year": year,
                },
            })
        );

        console.log("QueryCommand response: ", commandOutput);

        if (!commandOutput.Items || commandOutput.Items.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ message: "No reviews found for the reviewer and year" }),
            };
        }

        // Convert the DynamoDB items to Review type
        const reviews: Review[] = commandOutput.Items.map((item) => {
            return {
                movieId: item.movieId,
                reviewerName: item.reviewerName,
                reviewDate: item.reviewDate,
                content: item.content,
            };
        });

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ data: reviews }),
        };
    } catch (error: any) {
        console.error(JSON.stringify(error));
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ error }),
        };
    }
};

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
