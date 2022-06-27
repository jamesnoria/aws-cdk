import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

export class S3ReadCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "ResumeUploadBucket", {
      encryption: BucketEncryption.S3_MANAGED,
    });

    new s3deploy.BucketDeployment(this, "BucketDeployment", {
      sources: [s3deploy.Source.asset(path.resolve(__dirname, "../../assets"))],
      destinationBucket: bucket,
    });

    const websiteBucket = new Bucket(this, "WebsiteBucket", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "error.html",
      publicReadAccess: true,
    });

    const cloudFront = new cloudfront.CloudFrontWebDistribution(
      this,
      "CloudFront",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: websiteBucket,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
      }
    );

    new s3deploy.BucketDeployment(this, "WebsiteBucketDeployment", {
      sources: [
        s3deploy.Source.asset(path.resolve(__dirname, "../../frontend/build")),
      ],
      destinationBucket: websiteBucket,
      distribution: cloudFront,
    });

    const uploadCV = new lambda.Function(this, "ResumeUploadLambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "upload.getCV",
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, "../../src/functions")
      ),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    const bucketContainerPermission = new PolicyStatement();
    bucketContainerPermission.addResources(bucket.bucketArn);
    bucketContainerPermission.addActions("s3:ListBucket");

    const bucketObjectPermission = new PolicyStatement();
    bucketObjectPermission.addResources(bucket.bucketArn + "/*");
    bucketObjectPermission.addActions("s3:GetObject", "s3:PutObject");

    uploadCV.addToRolePolicy(bucketContainerPermission);
    uploadCV.addToRolePolicy(bucketObjectPermission);

    const uploadApi = new apigateway.RestApi(this, "ResumeUploadApi", {
      defaultCorsPreflightOptions: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    uploadApi.root
      .resourceForPath("/cv")
      .addMethod("GET", new apigateway.LambdaIntegration(uploadCV));

    new CfnOutput(this, "jamesnoriaCVExport", {
      value: bucket.bucketName,
      exportName: "jamesnoriaCV",
    });

    new CfnOutput(this, "MyCloudFrontDomain", {
      value: cloudFront.distributionDomainName,
      exportName: "MyCloudFrontDomain",
    });
  }
}

//despliege infrestuctura
//
