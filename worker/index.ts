import {
  handlePortfolioRequest,
  type ExecutionContextLike,
  type PortfolioBindings
} from '../src/server/portfolioApi.ts';
import { curateWeekly } from '../src/server/suggestions.ts';

export async function scheduled(
  _controller: unknown,
  env: PortfolioBindings,
  ctx?: ExecutionContextLike
): Promise<void> {
  const task = curateWeekly(env);
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(task);
    return;
  }
  await task;
}

export default {
  async fetch(
    request: Request,
    env: PortfolioBindings,
    ctx?: ExecutionContextLike
  ): Promise<Response> {
    return (await handlePortfolioRequest(request, env, ctx)) ?? new Response(null, { status: 404 });
  },
  scheduled
};
