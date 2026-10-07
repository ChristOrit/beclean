export interface VercelRequest {
  method?: string;
  body?: Record<string, unknown> | string | null;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[] | undefined>;
}

export interface VercelResponse {
  status(code: number): VercelResponse;
  json(payload: unknown): VercelResponse;
  send(payload: unknown): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
}
