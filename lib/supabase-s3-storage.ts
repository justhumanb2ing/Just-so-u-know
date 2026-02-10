import { S3Client } from "@aws-sdk/client-s3";
import { buildPublicObjectBaseUrlFromS3Endpoint, PAGE_IMAGE_BUCKET_NAME } from "@/service/onboarding/page-image";

type SupabaseS3Config = {
  endpoint: string;
  region: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicObjectBaseUrl: string;
};

let cachedConfig: SupabaseS3Config | null = null;
let cachedClient: S3Client | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

/**
 * Supabase S3 연동 환경 변수를 로드하고 public URL base를 계산한다.
 */
export function getSupabaseS3Config(): SupabaseS3Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const endpoint = getRequiredEnv("SUPABASE_S3_ENDPOINT");
  const region = getRequiredEnv("SUPABASE_S3_REGION");
  const accessKeyId = getRequiredEnv("SUPABASE_S3_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("SUPABASE_S3_SECRET_ACCESS_KEY");
  const configuredBucket = process.env.SUPABASE_S3_BUCKET?.trim();
  const bucketName = configuredBucket && configuredBucket.length > 0 ? configuredBucket : PAGE_IMAGE_BUCKET_NAME;

  cachedConfig = {
    endpoint,
    region,
    bucketName,
    accessKeyId,
    secretAccessKey,
    publicObjectBaseUrl: buildPublicObjectBaseUrlFromS3Endpoint(endpoint),
  };

  return cachedConfig;
}

/**
 * Supabase Storage S3 엔드포인트용 AWS SDK 클라이언트를 싱글턴으로 생성한다.
 */
export function getSupabaseS3Client() {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getSupabaseS3Config();

  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return cachedClient;
}
