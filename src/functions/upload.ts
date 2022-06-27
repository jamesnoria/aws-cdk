import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { S3 } from "aws-sdk";

const BUCKET_NAME = process.env.BUCKET_NAME!;

const s3 = new S3();

const generateUrl = async (
  object: S3.Object
): Promise<{ filename: string; url: string }> => {
  const url = s3.getSignedUrl("getObject", {
    Bucket: BUCKET_NAME,
    Key: object.Key!,
    Expires: 24 * 60 * 60,
  });

  return {
    filename: object.Key!,
    url,
  };
};

export const getCV = async (
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { Contents: results } = await s3
      .listObjects({ Bucket: BUCKET_NAME })
      .promise();
    const assets = await Promise.all(
      results!.map((result) => generateUrl(result))
    );
    return {
      statusCode: 200,
      body: JSON.stringify(assets),
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};
