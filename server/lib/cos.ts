import { S3Client } from '@aws-sdk/client-s3'

let cosClient: S3Client | null = null;

export function getCosClient(findConfig: any[]) {
  if (!findConfig.length) {
    console.warn('警告：无法获取 COS 配置信息，请配置相应信息。');
  }
  if (cosClient) return cosClient

  const secretId = findConfig.find((item: any) => item.config_key === 'cos_secret_id')?.config_value || '';
  const secretKey = findConfig.find((item: any) => item.config_key === 'cos_secret_key')?.config_value || '';
  const region = findConfig.find((item: any) => item.config_key === 'cos_region')?.config_value || '';
  const endpoint = `cos.${region}.myqcloud.com`;

  cosClient = new S3Client({
    region: region,
    endpoint: `https://${endpoint}`,
    credentials: {
      accessKeyId: secretId,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  });

  return cosClient;
} 