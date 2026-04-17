## Title: Session Replay for Onboarding: Finding Where Users Get Stuck

## URL: https://usertourkit.com/blog/session-replay-onboarding

## Comment to post immediately after:

I wrote this after spending weeks combining funnel analytics with session replay to debug onboarding drop-offs. The central insight: funnel charts show you where users leave, but session replay shows you why.

Some specific data points from the research: session replay SDK sizes range from 29KB (Sentry with tree-shaking) to 553KB (Contentsquare) gzipped, a 15x difference. Sentry Engineering published a detailed case study on reducing their replay SDK by 35% using build-time tree-shaking flags and migrating from pako to fflate compression.

The privacy angle is increasingly important. GDPR fines can reach 20M EUR, and US wiretapping lawsuits against companies using session replay are on the rise. Most SDKs now ship "private by default" with automatic PII masking, but onboarding flows contain data (workspace names, role selections) that generic redaction misses.

The article covers tool comparison with bundle sizes, a React integration pattern for connecting tour events to replay filters, a weekly workflow for reviewing replays without burning hours, and GDPR compliance for onboarding recording. Open to feedback on anything I got wrong.
