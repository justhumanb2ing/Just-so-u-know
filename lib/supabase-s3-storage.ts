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

type SupabaseS3ConfigOptions = {
  bucketName?: string;
};

const cachedConfigByBucketName = new Map<string, SupabaseS3Config>();
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
export function getSupabaseS3Config(options: SupabaseS3ConfigOptions = {}): SupabaseS3Config {
  const endpoint = getRequiredEnv("SUPABASE_S3_ENDPOINT");
  const region = getRequiredEnv("SUPABASE_S3_REGION");
  const accessKeyId = getRequiredEnv("SUPABASE_S3_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("SUPABASE_S3_SECRET_ACCESS_KEY");
  const configuredBucket = options.bucketName?.trim() || process.env.SUPABASE_S3_BUCKET?.trim();
  const bucketName = configuredBucket && configuredBucket.length > 0 ? configuredBucket : PAGE_IMAGE_BUCKET_NAME;

  const cachedConfig = cachedConfigByBucketName.get(bucketName);
  if (cachedConfig) {
    return cachedConfig;
  }

  const nextConfig: SupabaseS3Config = {
    endpoint,
    region,
    bucketName,
    accessKeyId,
    secretAccessKey,
    publicObjectBaseUrl: buildPublicObjectBaseUrlFromS3Endpoint(endpoint),
  };
  cachedConfigByBucketName.set(bucketName, nextConfig);

  return nextConfig;
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
