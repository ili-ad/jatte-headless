(backend) iliad@DESKTOP-1HF68IV:~/dev/jatte-headless/backend$ python manage.py ingest_fl_rag --root ~/dev/jatte-headless/RAG/md
/home/iliad/dev/jatte-headless/backend
Using root: /home/iliad/dev/jatte-headless/RAG/md
Found 11 markdown files.
Ingested 32 chunks from florida_affadavit_of_nonpayment_caselaw.md (topic=affadavit_of_nonpayment_caselaw).
Ingested 29 chunks from florida_discharge_bond_caselaw.md (topic=discharge_bond_caselaw).
Ingested 8 chunks from florida_lien_analysis.md (topic=lien_analysis).
Ingested 20 chunks from florida_lien_waiver_caselaw.md (topic=lien_waiver_caselaw).
Ingested 56 chunks from florida_mechanics_liens_caselaw.md (topic=mechanics_liens_caselaw).
Ingested 23 chunks from florida_noc_caselaw.md (topic=noc_caselaw).
Ingested 57 chunks from florida_noc_compliance.md (topic=noc_compliance).
Ingested 42 chunks from florida_notice_of_commencement_of_lien_action_caselaw.md (topic=notice_of_commencement_of_lien_action_caselaw).
Ingested 29 chunks from florida_notice_of_contest_of_lien_caselaw.md (topic=notice_of_contest_of_lien_caselaw).
Ingested 39 chunks from florida_release_and_cancellation_caselaw.md (topic=release_and_cancellation_caselaw).
Ingested 55 chunks from florida_statutory_crosswalk.md (topic=statutory_crosswalk).
Done. Total chunks processed: 390
(backend) iliad@DESKTOP-1HF68IV:~/dev/jatte-headless/backend$ python manage.py embed_chunks --state FL --model text-embedding-3-small
/home/iliad/dev/jatte-headless/backend
Embedding 390 chunks for state=FL using model=text-embedding-3-small, batch_size=64
Embedded batch of 64 chunks: ids=1..64 (total processed: 64/390)
Embedded batch of 64 chunks: ids=65..128 (total processed: 128/390)
Embedded batch of 64 chunks: ids=129..192 (total processed: 192/390)
Embedded batch of 64 chunks: ids=193..256 (total processed: 256/390)
Embedded batch of 64 chunks: ids=257..320 (total processed: 320/390)
Embedded batch of 64 chunks: ids=321..384 (total processed: 384/390)
Embedded batch of 6 chunks: ids=385..390 (total processed: 390/390)
Done. Total chunks embedded (or would embed in dry-run): 390
(backend) iliad@DESKTOP-1HF68IV:~/dev/jatte-headless/backend$ python manage.py test_agent_rag "What are the mailings and deadlines on a private job in Florida?" --state FL --k 5
/home/iliad/dev/jatte-headless/backend
[RAG] prompt='What are the mailings and deadlines on a private job in Florida?' state='FL' topic=None k=5
[RAG] found 5 chunk(s); top 5:
  1. id=97 score=None snippet='## Timeliness of Recording: 90-Day Deadline & “Final Furnishing” **Practical Guidance:** Mark the date when you *substantially finish* your work or delivery...'
  2. id=96 score=None snippet='## Timeliness of Recording: 90-Day Deadline & “Final Furnishing” **Practical Guidance:** Mark the date when you *substantially finish* your work or delivery...'
  3. id=158 score=None snippet='## Practical Recommendations to Preserve Lien Rights under §713.06 For subcontractors, suppliers, and other lienors in Florida, the following best practices...'
  4. id=362 score=None snippet='## Compliance Checklist for Contractors & Platforms This concise checklist distills the critical compliance steps under Florida’s lien law. **Contractors,...'
  5. id=389 score=None snippet='## Additional Resources and Best Practice Guides In implementing a compliance toolkit, it’s wise to cross-reference multiple sources: the statute for the...'
(backend) iliad@DESKTOP-1HF68IV:~/dev/jatte-headless/backend$ python manage.py test_agent_rag "An owner serves a formal §713.16(2) Request for Sworn Statement of Account on a GC whose lien is already recorded. The GC sends back a detailed breakdown of the account within 30 days, but forgets to swear to it (no notarization, no 92.525 “under penalties of perjury” language). The owner moves to discharge the lien on that basis.

Question: Under modern case law, does the GC lose its lien, or can the unsworn response (plus a later affidavit) save it?" --state FL --k 5
/home/iliad/dev/jatte-headless/backend
[RAG] prompt='An owner serves a formal §713.16(2) Request for Sworn Statement of Account on a GC whose lien is already recorded. The GC sends back a detailed breakdown of the account within 30 days, but forgets to swear to it (no notarization, no 92.525 “under penalties of perjury” language). The owner moves to discharge the lien on that basis.\n\nQuestion: Under modern case law, does the GC lose its lien, or can the unsworn response (plus a later affidavit) save it?' state='FL' topic=None k=5
[RAG] found 5 chunk(s); top 5:
  1. id=112 score=None snippet='## Responding to Owner’s Demands: Sworn Statement of Account (§713.16) These cases make clear that an owner’s demand for a statement of account is a...'
  2. id=109 score=None snippet='## Responding to Owner’s Demands: Sworn Statement of Account (§713.16) Even after a lien is recorded, a lienor’s compliance obligations aren’t over. Florida...'
  3. id=110 score=None snippet='## Responding to Owner’s Demands: Sworn Statement of Account (§713.16) Even after a lien is recorded, a lienor’s compliance obligations aren’t over. Florida...'
  4. id=114 score=None snippet='## Responding to Owner’s Demands: Sworn Statement of Account (§713.16) **Practical Guidance:** As a lienor, you must be prepared to **respond immediately to...'
  5. id=113 score=None snippet='## Responding to Owner’s Demands: Sworn Statement of Account (§713.16) **Practical Guidance:** As a lienor, you must be prepared to **respond immediately to...'
(backend) iliad@DESKTOP-1HF68IV:~/dev/jatte-headless/backend$ 