declare module 'serverless-http' {
  import type { VercelRequest, VercelResponse } from '@vercel/node';

  function serverless(app: any): (req: VercelRequest, res: VercelResponse) => Promise<void>;
  export default serverless;
}
