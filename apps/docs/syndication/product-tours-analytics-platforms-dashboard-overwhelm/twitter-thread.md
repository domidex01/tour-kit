## Thread (6 tweets)

**1/** Analytics dashboards overwhelm users by showing 20-30 interactive elements on the default view. Working memory holds 7 items. That math doesn't work.

I tested two onboarding approaches on dashboard prototypes. Here's what actually works:

**2/** Feature walkthrough tours (8 steps, "this is the filter panel"): 34% completion rate.

Activation-path tours (4 steps, guiding to first populated chart): 78%.

Users don't need features explained. They need their activation path revealed.

**3/** The biggest mistake: one-size-fits-all onboarding.

A data analyst needs event setup guidance. A marketing director needs funnel visualization. An executive needs KPI summaries.

Role-based branching captures 200%+ conversion lift (OneSignal data via Mixpanel).

**4/** Progressive disclosure in three phases:

Day 1: Show 3-5 key elements (90 seconds max)
Days 2-7: Contextual tours on first visit to new sections
Weeks 2-4: Power-user tips after readiness signals

Don't teach the whole tool on day one.

**5/** The compliance angle nobody talks about:

SOC 2 and HIPAA constrain how tour overlays interact with displayed data. Third-party onboarding scripts can read DOM content including sensitive metrics.

In-bundle solutions (like Tour Kit at <8KB gzipped) avoid this entirely.

**6/** Full guide with React code examples, platform comparison table (Metabase at <5 min vs Looker at days), and cognitive load reduction patterns:

https://usertourkit.com/blog/product-tours-analytics-platforms-dashboard-overwhelm
