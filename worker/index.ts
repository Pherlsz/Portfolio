import { handlePortfolioRequest, type PortfolioBindings } from '../src/server/portfolioApi.ts';

export default {
  async fetch(request: Request, env: PortfolioBindings): Promise<Response> {
    return (await handlePortfolioRequest(request, env)) ?? new Response(null, { status: 404 });
  }
};
