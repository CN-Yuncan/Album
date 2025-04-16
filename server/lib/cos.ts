import COS from 'cos-js-sdk-v5'

let cosClient: COS | null = null;

export function getCosClient(findConfig: any[]) {
  if (!findConfig.length) {
    console.warn('警告：无法获取 COS 配置信息，请配置相应信息。');
  }
  if (cosClient) return cosClient

  const cosSecretId = findConfig.find((item: any) => item.config_key === 'cos_secret_id')?.config_value || '';
  const cosSecretKey = findConfig.find((item: any) => item.config_key === 'cos_secret_key')?.config_value || '';
  const cosRegion = findConfig.find((item: any) => item.config_key === 'cos_region')?.config_value || '';

  cosClient = new COS({
    SecretId: cosSecretId,
    SecretKey: cosSecretKey,
    Region: cosRegion,
    UploadCheckContentMd5: true,
  } as any);

  return cosClient;
} 