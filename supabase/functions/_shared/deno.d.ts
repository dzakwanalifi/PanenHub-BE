// Type definitions for Deno environment
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  
  const env: Env;
  
  interface ServeOptions {
    port?: number;
    hostname?: string;
  }
  
  function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: ServeOptions
  ): void;
} 