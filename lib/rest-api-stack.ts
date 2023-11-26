import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import * as apig from "aws-cdk-lib/aws-apigateway";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { movies } from "../seed/movies";
import { reviews } from "../seed/reviews";

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables 
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    const reviewsTable = new dynamodb.Table(this, "ReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Reviews",
    });

    // Functions 
    // Movies
    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const getAllMoviesFn = new lambdanode.NodejsFunction(
      this,
      "GetAllMoviesFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getAllMovies.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const newMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/addMovie.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const deleteMovieFn = new lambdanode.NodejsFunction(this, "DeleteMovieFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/deleteMovie.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: moviesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // Reviews
    const getReviewsByMovieIdFn = new lambdanode.NodejsFunction(
      this,
      "GetReviewByMovieIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getReviewByMovieId.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: reviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const getReviewByReviewerFn = new lambdanode.NodejsFunction(
      this,
      "GetReviewByReviewerFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getReviewByReviewer.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: reviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const getReviewsByReviewerFn = new lambdanode.NodejsFunction(
      this,
      "GetReviewsByReviewerFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getReviewsByReviewer.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: reviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const getReviewsByYearFn = new lambdanode.NodejsFunction(this, "GetReviewsByYearFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getReviewsByYear.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: reviewsTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );


    const newReviewFn = new lambdanode.NodejsFunction(this, "AddReviewFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: `${__dirname}/../lambdas/addReview.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: reviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    // Translate
    const getTranslatedReviewFn = new NodejsFunction(this, "GetTranslatedReviewFn", {
      entry: `${__dirname}/../lambdas/getTranslatedReview.ts`,
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        TABLE_NAME: reviewsTable.tableName,
        REGION: "eu-west-1",
      },
    });

    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [moviesTable.tableName]: generateBatch(movies),
            [reviewsTable.tableName]: generateBatch(reviews),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [moviesTable.tableArn, reviewsTable.tableArn],
      }),
    });

    // Permissions
    // Movies
    moviesTable.grantReadData(getMovieByIdFn)
    moviesTable.grantReadData(getAllMoviesFn)
    moviesTable.grantReadWriteData(newMovieFn)
    moviesTable.grantReadData(getTranslatedReviewFn);

    // Reviews
    reviewsTable.grantReadData(getReviewsByMovieIdFn)
    reviewsTable.grantReadData(getReviewByReviewerFn)
    reviewsTable.grantReadData(getReviewsByReviewerFn)
    reviewsTable.grantReadData(getReviewsByYearFn)
    reviewsTable.grantReadWriteData(newReviewFn)

    const api = new apig.RestApi(this, "RestAPI", {
      description: "demo api",
      deployOptions: {
        stageName: "dev",
      },
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    // Movies Endpoints
    const moviesEndpoint = api.root.addResource("movies");
    moviesEndpoint.addMethod("GET", new apig.LambdaIntegration(getAllMoviesFn, { proxy: true }));
    moviesEndpoint.addMethod("POST", new apig.LambdaIntegration(newMovieFn, { proxy: true }));

    const singleMovieEndpoint = moviesEndpoint.addResource("{movieId}");
    singleMovieEndpoint.addMethod("GET", new apig.LambdaIntegration(getMovieByIdFn, { proxy: true }));
    singleMovieEndpoint.addMethod("DELETE", new apig.LambdaIntegration(deleteMovieFn, { proxy: true }));

    // Reviews Endpoints
    const moviesReviewsEndpoint = moviesEndpoint.addResource("reviews");
    const reviewsByReviewerEndpoint = moviesReviewsEndpoint.addResource("{reviewerName}");
    reviewsByReviewerEndpoint.addMethod("GET", new apig.LambdaIntegration(getReviewsByReviewerFn, { proxy: true }));

    const reviewsByMovieEndpoint = singleMovieEndpoint.addResource("reviews");
    reviewsByMovieEndpoint.addMethod("GET", new apig.LambdaIntegration(getReviewsByMovieIdFn, { proxy: true }));

    const reviewByReviewerEndpoint = reviewsByMovieEndpoint.addResource("{reviewerName}");
    reviewByReviewerEndpoint.addMethod("GET", new apig.LambdaIntegration(getReviewByReviewerFn, { proxy: true }));

    const generalReviewsEndpoint = api.root.addResource("reviews");
    generalReviewsEndpoint.addMethod("POST", new apig.LambdaIntegration(newReviewFn, { proxy: true }));

    const reviewsByYearEndpoint = singleMovieEndpoint.addResource("{year}");
    reviewsByYearEndpoint.addMethod("GET", new apig.LambdaIntegration(getReviewsByYearFn));

    // Translate
    const translateReviewEndpoint = reviewByReviewerEndpoint.addResource("translation");
    translateReviewEndpoint.addMethod("GET", new apig.LambdaIntegration(getTranslatedReviewFn));
  }
}
