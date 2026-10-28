declare module 'serverless-http' {
  import type { IncomingMessage, ServerResponse } from 'http';
  import type { Handler } from '@vercel/node';

  function serverless(app: any): Handler;
  export default serverless;
}
