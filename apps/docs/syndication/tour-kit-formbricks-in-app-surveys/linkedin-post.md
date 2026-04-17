Most product teams collect feedback at the wrong time.

They send an email survey 2 days after onboarding. By then, the user has forgotten what confused them. The response rate is under 5%.

We wired Formbricks (open-source survey tool, 11.8K GitHub stars) to trigger a CES survey 2 seconds after a product tour finishes. That 2-second delay was the sweet spot in our testing — instant felt jarring, 5 seconds meant the user had already moved on.

The whole integration is about 40 lines of TypeScript. Tour Kit fires an `onComplete` callback, which calls `formbricks.track()`. Formbricks shows the matching survey.

Interesting finding: 27% of users dismiss tours early (per Chameleon's 15M-interaction benchmark). Collecting separate feedback from that group with a single question — "What made you close the tour?" — was more useful than the standard CES survey.

Both tools are open source. Zero recurring cost if you self-host.

Full tutorial: https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys

#react #opensource #productmanagement #onboarding #webdevelopment
