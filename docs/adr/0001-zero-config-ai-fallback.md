# Zero-Config AI Advisor Fallback

We decided to equip the AI Advisor with a transparent, deterministic heuristic fallback that activates automatically whenever `OPENAI_API_KEY` is absent. This guarantees that evaluators, reviewers, and automated CI pipelines run the entire end-to-end user journey out-of-the-box without requiring API credentials or failing with HTTP 500 errors.
