"Add a slideout here."

In the last month, I've heard the same UI pattern called a slideout, a drawer, a side panel, and a sliding pane. By four different teams.

There's no industry standard. Adobe calls it a slideout. Material UI calls it a drawer. PatternFly (Red Hat) uses drawer too. In the in-app messaging space, Appcues and Userpilot both call it a slideout.

The real difference isn't the name or the animation. It's the intent:
- Slideout = contextual content, sub-tasks, announcements
- Drawer = navigation, filtering
- Modal = "stop and decide"
- Toast = "FYI, moving on"

Each one needs different ARIA attributes for accessibility. Most teams get this wrong.

I wrote a glossary entry that maps the terminology across design systems, includes a comparison table with correct ARIA roles, and covers accessibility requirements from Knowbility's research.

https://usertourkit.com/blog/what-is-a-slideout

#react #uidesign #accessibility #webdevelopment #frontend
