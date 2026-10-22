/*
 * Quiz questions. To add one, copy any entry and edit it:
 *   c: topic   q: question   o: options (2–5)   a: index of the correct option (0-based)   w: why
 */
window.SDB = window.SDB || {};
SDB.data = SDB.data || {};
SDB.data.quiz = [
  /* ------------------------------------------------------------ LLMs */
  { c: "LLMs", q: "At its core, an LLM generates text by…", o: ["Looking up answers in a database", "Repeatedly predicting the next token given all previous tokens", "Translating from a template", "Running SQL"], a: 1, w: "Generation is a loop of next-token predictions." },
  { c: "LLMs", q: "A token is roughly…", o: ["A whole sentence", "A sub-word piece (≈4 English characters on average)", "A byte", "A paragraph"], a: 1, w: "Pricing and context limits are measured in tokens." },
  { c: "LLMs", q: "The context window is…", o: ["The model's training data", "The maximum tokens of input + output the model can handle in one call", "The chat UI", "A cache"], a: 1, w: "Everything the model uses must fit inside it." },
  { c: "LLMs", q: "LLM APIs are stateless, so chat memory is…", o: ["Stored inside the model", "Your app re-sending history (or summaries) each call", "Impossible", "Handled by the GPU"], a: 1, w: "Or stored server-side by a framework, then re-injected." },
  { c: "LLMs", q: "Main reason LLMs hallucinate:", o: ["Bugs in the API", "They're trained to produce plausible continuations, not verified facts", "Low temperature", "Too many GPUs"], a: 1, w: "Grounding, citations and tools reduce it." },
  { c: "LLMs", q: "Correct training order:", o: ["RLHF → pre-training → SFT", "Pre-training → instruction tuning (SFT) → preference tuning", "SFT → pre-training → RAG", "Fine-tuning only"], a: 1, w: "Preference tuning includes RLHF, RLAIF, DPO." },
  { c: "LLMs", q: "Attention lets each token…", o: ["Skip computation", "Weigh information from other tokens by relevance", "Store facts", "Compress the prompt"], a: 1, w: "Its cost grows with the square of sequence length." },
  { c: "LLMs", q: "Temperature 0 means…", o: ["Random output", "Always pick the most likely token (greedy)", "No output", "Highest creativity"], a: 1, w: "Mostly deterministic, not perfectly." },
  { c: "LLMs", q: "Top-p = 0.9 means…", o: ["Pick the top 9 tokens", "Sample only from the smallest set of tokens covering 90% probability", "90% temperature", "90% of the prompt"], a: 1, w: "Nucleus sampling trims the unlikely tail." },
  { c: "LLMs", q: "Which usually costs more per token?", o: ["Input tokens", "Output tokens", "They're always equal", "Neither is billed"], a: 1, w: "And output is generated sequentially, so it dominates latency." },
  { c: "LLMs", q: "Prompt caching saves money when…", o: ["Every prompt is different", "Prompts share a long identical prefix (system prompt, tools, documents)", "Temperature is 0", "Using streaming"], a: 1, w: "Put static content first." },
  { c: "LLMs", q: "Best first step to reduce perceived latency of a chat answer:", o: ["Bigger model", "Stream tokens to the user", "Higher temperature", "Longer prompt"], a: 1, w: "Users see progress immediately." },
  { c: "LLMs", q: "Few-shot prompting means…", o: ["Retrying a few times", "Including a few input→output examples in the prompt", "Using a small model", "Short answers"], a: 1, w: "Pins down format and edge cases." },
  { c: "LLMs", q: "Why delimit inserted documents/user text with tags?", o: ["Looks nicer", "Separates data from instructions; helps against injection and confusion", "Required by JSON", "Reduces tokens"], a: 1, w: "And tell the model to treat it as data." },
  { c: "LLMs", q: "Reliable machine-readable output is best achieved with…", o: ["'Please answer in JSON'", "Structured output / JSON schema mode + validation and retry", "High temperature", "Few-shot only"], a: 1, w: "Spring AI's .entity(Record.class) does this." },
  { c: "LLMs", q: "Reasoning models are best suited to…", o: ["Simple classification at huge volume", "Multi-step maths, code and planning, at higher cost/latency", "Embeddings", "Image resizing"], a: 1, w: "Route simple tasks to cheaper models." },

  /* ------------------------------------------------------------ RAG */
  { c: "RAG", q: "Embeddings place texts so that…", o: ["Alphabetical order is kept", "Similar meanings are close together", "Longer texts are bigger", "Numbers are exact"], a: 1, w: "Search becomes nearest-neighbour lookup." },
  { c: "RAG", q: "Most common similarity measure for text embeddings:", o: ["Hamming distance", "Cosine similarity", "Edit distance", "Jaccard"], a: 1, w: "Dot product is equivalent for normalised vectors." },
  { c: "RAG", q: "You switch embedding models. You must…", o: ["Nothing", "Re-embed all documents: vectors from different models aren't comparable", "Only re-embed queries", "Change the LLM"], a: 1, w: "Same model for queries and documents." },
  { c: "RAG", q: "Embeddings are weakest at matching…", o: ["Synonyms", "Paraphrases", "Exact identifiers like SKU-7781 or error codes", "Topics"], a: 2, w: "Hybrid keyword search fixes this." },
  { c: "RAG", q: "HNSW is…", o: ["A tokenizer", "A graph-based approximate nearest-neighbour index", "An embedding model", "A prompt format"], a: 1, w: "Fast, high-recall ANN search." },
  { c: "RAG", q: "Why filter by tenant in the vector query?", o: ["Speed only", "So users only retrieve documents they're allowed to see", "To reduce tokens", "It's optional"], a: 1, w: "Access control belongs in retrieval, not in the prompt." },
  { c: "RAG", q: "RAG mainly solves…", o: ["Model training cost", "Answering from private, fresh knowledge with citations", "GPU shortages", "Tokenization"], a: 1, w: "Update knowledge by re-indexing, not retraining." },
  { c: "RAG", q: "In RAG, 'augment' means…", o: ["Fine-tune the model", "Add retrieved context to the prompt", "Increase temperature", "Add more GPUs"], a: 1, w: "Retrieve → augment → generate." },
  { c: "RAG", q: "Your RAG bot answers wrongly. First thing to check:", o: ["Switch to a bigger model", "Whether the right chunks were retrieved", "Temperature", "The UI"], a: 1, w: "Most failures are retrieval failures." },
  { c: "RAG", q: "A good RAG prompt tells the model to…", o: ["Use its general knowledge freely", "Answer only from the context, cite sources, and say when it doesn't know", "Ignore the context", "Be creative"], a: 1, w: "Reduces hallucination." },
  { c: "RAG", q: "Chunks that are too small tend to…", o: ["Be perfect", "Lose context ('they expire after 12 months' — what does?)", "Cost nothing", "Improve citations automatically"], a: 1, w: "Too large chunks are vague and noisy." },
  { c: "RAG", q: "Parent–child (small-to-big) retrieval…", o: ["Uses two LLMs", "Searches small chunks but returns their larger parent section", "Splits by user", "Is a vector DB"], a: 1, w: "Precise matching plus full context." },
  { c: "RAG", q: "Hybrid search combines…", o: ["Two LLMs", "Keyword (BM25) and vector search, e.g. with Reciprocal Rank Fusion", "SQL and NoSQL", "CPU and GPU"], a: 1, w: "Catches exact terms and meaning." },
  { c: "RAG", q: "A cross-encoder reranker…", o: ["Embeds query and docs separately", "Scores each query–document pair jointly for better precision", "Generates answers", "Chunks documents"], a: 1, w: "Retrieve 20–50 cheaply, rerank, keep 3–5." },
  { c: "RAG", q: "HyDE retrieves using…", o: ["The raw question", "The embedding of a hypothetical answer generated by an LLM", "Random vectors", "Keywords only"], a: 1, w: "Bridges question vs document phrasing." },
  { c: "RAG", q: "GraphRAG is most useful for…", o: ["Single-fact lookups", "Questions about relationships and themes across many documents", "Image search", "Reducing tokens"], a: 1, w: "Costly ingestion: entity/relation extraction." },
  { c: "RAG", q: "Agentic RAG means…", o: ["Retrieval always runs once", "The model decides when/what to retrieve, possibly in several steps", "No retrieval", "Using agents to chunk"], a: 1, w: "Good for multi-hop questions." },
  { c: "RAG", q: "Recall@5 measures…", o: ["Answer length", "Whether a relevant chunk appears in the top 5 results", "Latency", "Token cost"], a: 1, w: "A retrieval metric." },
  { c: "RAG", q: "Faithfulness / groundedness measures…", o: ["Speed", "Whether the answer's claims are supported by the retrieved context", "User satisfaction", "Chunk size"], a: 1, w: "Often judged by an LLM with a rubric." },
  { c: "RAG", q: "LLM-as-judge results should be…", o: ["Trusted blindly", "Calibrated against human labels on a sample", "Ignored", "Only used for latency"], a: 1, w: "Judges have biases (length, position, self-preference)." },
  { c: "RAG", q: "A semantic cache returns a stored answer when…", o: ["The question text is identical", "A new question's embedding is very close to a past question's", "The user is logged in", "Temperature is 0"], a: 1, w: "Invalidate when source documents change." },

  /* ------------------------------------------------------------ Agents & MCP */
  { c: "Agents & MCP", q: "In tool calling, who executes the function?", o: ["The LLM", "Your application code", "The vector DB", "The user's browser always"], a: 1, w: "The model only requests the call." },
  { c: "Agents & MCP", q: "Where should authorisation for a tool live?", o: ["In the system prompt", "Inside the tool's code, using the real user's identity", "In the tool description", "Nowhere"], a: 1, w: "Prompts are not a security boundary." },
  { c: "Agents & MCP", q: "An agent is best described as…", o: ["A bigger model", "An LLM using tools in a loop toward a goal, with memory and guardrails", "A vector DB", "A prompt template"], a: 1, w: "Reason → act → observe → repeat." },
  { c: "Agents & MCP", q: "Why prefer workflows over autonomous agents when possible?", o: ["Agents are illegal", "Workflows are more predictable, testable and cheaper", "Workflows are smarter", "Agents can't use tools"], a: 1, w: "Errors compound across agent steps." },
  { c: "Agents & MCP", q: "MCP primarily standardises…", o: ["Model training", "How AI apps discover and use external tools, resources and prompts", "Vector formats", "GPU drivers"], a: 1, w: "N+M integrations instead of N×M." },
  { c: "Agents & MCP", q: "MCP messages use…", o: ["GraphQL", "JSON-RPC 2.0", "SOAP", "gRPC only"], a: 1, w: "Over stdio or Streamable HTTP." },
  { c: "Agents & MCP", q: "Which are the three main things an MCP server exposes?", o: ["Models, GPUs, datasets", "Tools, resources, prompts", "Users, roles, policies", "Topics, queues, streams"], a: 1, w: "Model-, app- and user-controlled respectively." },
  { c: "Agents & MCP", q: "Local MCP servers typically use which transport?", o: ["stdio", "SMTP", "FTP", "WebRTC"], a: 0, w: "Remote servers use Streamable HTTP." },
  { c: "Agents & MCP", q: "In the 2026-07-28 MCP spec, the initialize handshake…", o: ["Is required twice", "Is removed: each request carries version and capabilities in _meta", "Moved to OAuth", "Is unchanged"], a: 1, w: "MCP became stateless; server/discover advertises capabilities." },
  { c: "Agents & MCP", q: "The 2026-07-28 spec removes which header?", o: ["Authorization", "Mcp-Session-Id", "Content-Type", "Accept"], a: 1, w: "No protocol-level sessions; Mcp-Method and Mcp-Name headers are added." },
  { c: "Agents & MCP", q: "Multi Round-Trip Requests (MRTR) replace…", o: ["tools/list", "Server-initiated requests like sampling, elicitation and roots/list", "OAuth", "stdio"], a: 1, w: "Server returns resultType input_required; client retries with inputResponses." },
  { c: "Agents & MCP", q: "Which MCP features were deprecated in 2026-07-28?", o: ["Tools and resources", "Roots, Sampling and Logging", "Prompts", "JSON-RPC"], a: 1, w: "Also the old HTTP+SSE transport and Dynamic Client Registration." },
  { c: "Agents & MCP", q: "Spring AI annotation that exposes a method as an MCP tool:", o: ["@Tool only", "@McpTool", "@RestController", "@Bean"], a: 1, w: "With @McpToolParam for parameters; @McpResource and @McpPrompt too." },
  { c: "Agents & MCP", q: "Indirect prompt injection comes from…", o: ["The system prompt", "Untrusted content the model reads: web pages, emails, docs, tool output", "The GPU", "Embeddings"], a: 1, w: "Contain it with least privilege and confirmations." },
  { c: "Agents & MCP", q: "The 'lethal trifecta' is private data + untrusted content + …", o: ["High temperature", "The ability to send data out", "A big context window", "RAG"], a: 1, w: "Remove one leg to block exfiltration." },
  { c: "Agents & MCP", q: "A remote multi-user MCP server should authenticate users with…", o: ["One shared admin API key", "OAuth with per-user, audience-bound tokens", "No auth", "IP allow-lists only"], a: 1, w: "Avoid confused-deputy problems." },

  /* ------------------------------------------------------------ Production */
  { c: "Production", q: "In Spring AI, an advisor is…", o: ["A human reviewer", "An interceptor around ChatClient calls (memory, RAG, safety, tools)", "A model provider", "A vector index"], a: 1, w: "Like servlet filters for model calls." },
  { c: "Production", q: "QuestionAnswerAdvisor adds…", o: ["Chat memory", "Retrieved documents from a VectorStore to the prompt", "Tool calling", "Billing"], a: 1, w: "Naive RAG in one line." },
  { c: "Production", q: "Switching from one model provider to another in Spring AI mostly needs…", o: ["Rewriting business code", "Changing the starter/configuration", "A new vector DB", "Fine-tuning"], a: 1, w: "Portable ChatModel/ChatClient abstractions." },
  { c: "Production", q: "Teaching a model your constantly changing product catalogue is best done with…", o: ["Fine-tuning weekly", "RAG / tools over the catalogue", "Higher temperature", "Longer prompts only"], a: 1, w: "Fine-tuning is for behaviour, style and format." },
  { c: "Production", q: "LoRA is…", o: ["A vector DB", "A parameter-efficient fine-tuning method training small low-rank adapters", "A prompt format", "A tokenizer"], a: 1, w: "QLoRA does it on a quantised base model." },
  { c: "Production", q: "Most important practice before changing a prompt in production:", o: ["Ask the model if it's better", "Run the evaluation set and compare", "Increase max_tokens", "Change temperature"], a: 1, w: "Prompts are code: version and test them." },
  { c: "Production", q: "If the primary LLM provider returns 429/5xx, a good system…", o: ["Fails hard", "Retries with backoff, then falls back to another model or a degraded mode", "Retries forever", "Increases temperature"], a: 1, w: "Circuit breakers and fallbacks like any dependency." },
  { c: "Production", q: "Which belongs in an LLM request trace?", o: ["Only the answer", "Prompt version, model version, retrieved chunk ids, tool calls, tokens, latency, cost", "The user's password", "Nothing"], a: 1, w: "Mask PII in logs." },
  { c: "Production", q: "To reduce cost for simple questions…", o: ["Always use the largest model", "Route them to a smaller, cheaper model", "Add more context", "Disable caching"], a: 1, w: "Escalate only hard ones." },
  { c: "Production", q: "In an AI system design answer, tenant isolation for RAG is enforced by…", o: ["Telling the model not to mix tenants", "Metadata filters applied from the authenticated identity in retrieval (and per-tenant caches)", "Temperature 0", "Bigger chunks"], a: 1, w: "Never from model output." }
];
