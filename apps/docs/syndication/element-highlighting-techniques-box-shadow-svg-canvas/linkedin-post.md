Every product tour library needs to spotlight elements on the page. Turns out the technique you choose matters more than you'd think.

I dug into how Driver.js, React Joyride, and Shepherd.js implement their element highlighting. The finding: all three independently migrated from CSS box-shadow to SVG overlays. The reason was stacking context bugs — when the spotlighted element sits inside a CSS transform parent, the overlay breaks.

The performance gap is significant. Box-shadow triggers 8-12ms of CPU paint per frame on mid-range devices. SVG path updates stay under 1ms because they're GPU-composited. That's the difference between smooth transitions and visible jank on a 10-step product tour.

I wrote up the full comparison with implementation code for three approaches (box-shadow, SVG cutout, canvas), a table covering 11 criteria, and the common mistakes that break tours in production.

https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas

#react #javascript #webdevelopment #css #svg #productdevelopment
