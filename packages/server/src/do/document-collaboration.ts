import { DurableObject } from "cloudflare:workers";

interface Env {
  DB: D1Database;
}

export class DocumentCollaboration extends DurableObject<Env> {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    return new Response("Document Collaboration DO");
  }
}
