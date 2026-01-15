(backend) $ python manage.py ingest_rag_md --root ~/dev/your-app/RAG/md --state CA
Using root: /home/you/dev/your-app/RAG/md
Found 12 markdown files.
Ingested 18 chunks from ca_overview.md (topic=overview).
Ingested 42 chunks from ca_deadlines.md (topic=deadlines).
Done. Total chunks processed: 120

(backend) $ python manage.py embed_chunks --state CA --model text-embedding-3-small
Embedding 120 chunks for state=CA using model=text-embedding-3-small, batch_size=64
Embedded batch of 64 chunks: ids=1..64 (total processed: 64/120)
Embedded batch of 56 chunks: ids=65..120 (total processed: 120/120)
Done. Total chunks embedded (or would embed in dry-run): 120

(backend) $ python manage.py test_agent_rag "What are the notice deadlines?" --state CA --k 5
[RAG] prompt='What are the notice deadlines?' state='CA' topic=None k=5
[RAG] found 5 chunk(s); top 5:
  1. id=12 score=None snippet='## Notice deadlines ...'
  2. id=34 score=None snippet='## Timing and delivery ...'
