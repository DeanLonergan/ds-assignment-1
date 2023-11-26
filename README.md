## ServerlessREST Sddignment - Distributed Systems.

__Name:__ Dean Lonergan

This repository contains the implementation of a serverless REST API for the AWS platform. A CDK stack creates the infrastructure. The domain context of the API is movie reviews.

### API endpoints.
 
+ POST /movies/reviews - add a movie review.
- [x] Implemented*
- [ ] Recorded

+ GET /movies/{movieId}/reviews - Get all the reviews for a movie with the specified id.
- [x] Implemented
- [x] Recorded

+ GET /movies/{movieId}/reviews?minRating=n - Get all the reviews for the movie with the specified ID with a rating greater than the minRating.
- [ ] Implemented
- [ ] Recorded

+ GET /movies/{movieId}/reviews/{reviewerName} - Get the review for the movie with the specified movie ID and written by the named reviewer.
- [x] Implemented
- [x] Recorded

+ GET /movies/{movieId}/reviews/{year} - Get the review(s) for the movie with the specified movie ID and were written in a specified year.
- [ ] Implemented
- [ ] Recorded

+ GET /movies/reviews/{reviewerName} - Get all the reviews written by a specific reviewer.
- [x] Implemented*
- [ ] Recorded

+ GET /movies/{movieId}/reviews/{reviewerName}/translation?language=code - Get a translated version of the review for the movie with the specified movie ID and written by the named reviewer.
- [ ] Implemented
- [ ] Recorded

[Include screenshots from the AWS console (API Gateway service) that clearly show the deployed API ( have legible font size). ]

![](./images/api1.png)

![](./images/api1.png)

### Authentication..

[Include a screenshot from the AWS console (Cognito User Pools) showing a confirmed user account.]

![](./images/pool.png)

### Independent learning (If relevant).

[ Briefly explain any aspects of your submission that required independent research and learning, i.e. not covered in the lectures/labs. State the files that have evidence of this.


State any other evidence of independent learning achieved while completing this assignment.

