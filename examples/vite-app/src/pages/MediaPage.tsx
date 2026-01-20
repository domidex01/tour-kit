import {
  GifPlayer,
  MediaHeadless,
  NativeVideo,
  TourMedia,
  VimeoEmbed,
  YouTubeEmbed,
} from '@tour-kit/media'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </section>
  )
}

function MediaCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="p-4 rounded-lg border bg-popover shadow-sm space-y-3">
      <h3 className="font-medium text-sm">{title}</h3>
      {children}
    </div>
  )
}

export default function MediaPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Media Components Demo</h1>
          <p className="text-muted-foreground">
            Embed videos, GIFs, and animations in your tours with auto-detection
          </p>
        </header>

        <Section
          title="Auto-Detection with TourMedia"
          description="TourMedia automatically detects the media type from the URL and renders the appropriate component."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MediaCard title="YouTube (auto-detected)">
              <TourMedia
                src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                alt="YouTube video demo"
                aspectRatio="16/9"
              />
            </MediaCard>

            <MediaCard title="Vimeo (auto-detected)">
              <TourMedia
                src="https://vimeo.com/76979871"
                alt="Vimeo video demo"
                aspectRatio="16/9"
              />
            </MediaCard>
          </div>
        </Section>

        <Section
          title="Direct Embed Components"
          description="Use specific embed components for more control over the player options."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MediaCard title="YouTubeEmbed with options">
              <YouTubeEmbed
                videoId="dQw4w9WgXcQ"
                title="YouTube with autoplay disabled"
                autoplay={false}
                muted={true}
                controls={true}
                aspectRatio="16/9"
              />
              <p className="text-xs text-muted-foreground">
                Uses youtube-nocookie.com for GDPR compliance
              </p>
            </MediaCard>

            <MediaCard title="VimeoEmbed with options">
              <VimeoEmbed
                videoId="76979871"
                title="Vimeo with DNT enabled"
                autoplay={false}
                muted={true}
                aspectRatio="16/9"
              />
              <p className="text-xs text-muted-foreground">Uses dnt=1 parameter for privacy</p>
            </MediaCard>
          </div>
        </Section>

        <Section
          title="Native Video"
          description="HTML5 video element with caption support and responsive sources."
        >
          <MediaCard title="Native Video Player">
            <NativeVideo
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              alt="Big Buck Bunny sample video"
              poster="https://peach.blender.org/wp-content/uploads/bbb-splash.png"
              controls={true}
              muted={true}
              aspectRatio="16/9"
            />
            <p className="text-xs text-muted-foreground">
              Supports captions, responsive sources, and prefers-reduced-motion
            </p>
          </MediaCard>
        </Section>

        <Section
          title="GIF Player"
          description="GIFs with play/pause controls and reduced motion support."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MediaCard title="GIF with controls">
              <GifPlayer
                src="https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif"
                alt="Animated demo GIF"
                aspectRatio="1/1"
                autoplay={true}
              />
              <p className="text-xs text-muted-foreground">
                Click to play/pause. Shows static frame when paused.
              </p>
            </MediaCard>

            <MediaCard title="GIF via TourMedia">
              <TourMedia
                src="https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif"
                alt="Demo GIF auto-detected"
                aspectRatio="16/9"
              />
            </MediaCard>
          </div>
        </Section>

        <Section
          title="Headless Component"
          description="Full control with render props for custom media player implementations."
        >
          <MediaCard title="MediaHeadless with custom UI">
            <MediaHeadless src="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
              {({ mediaType, embedUrl, videoId, isPlaying, play, pause, prefersReducedMotion }) => (
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded text-sm space-y-1">
                    <p>
                      <strong>Type:</strong> {mediaType}
                    </p>
                    <p>
                      <strong>Video ID:</strong> {videoId}
                    </p>
                    <p>
                      <strong>Embed URL:</strong>{' '}
                      <span className="text-xs break-all">{embedUrl}</span>
                    </p>
                    <p>
                      <strong>Playing:</strong> {isPlaying ? 'Yes' : 'No'}
                    </p>
                    <p>
                      <strong>Reduced Motion:</strong> {prefersReducedMotion ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={play}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                    >
                      Play
                    </button>
                    <button
                      type="button"
                      onClick={pause}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                    >
                      Pause
                    </button>
                  </div>
                </div>
              )}
            </MediaHeadless>
          </MediaCard>
        </Section>

        <Section
          title="Aspect Ratios"
          description="Various aspect ratio options for different content types."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['16/9', '4/3', '1/1', '9/16'] as const).map((ratio) => (
              <MediaCard key={ratio} title={ratio}>
                <TourMedia
                  src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  alt={`${ratio} aspect ratio demo`}
                  aspectRatio={ratio}
                  size="full"
                />
              </MediaCard>
            ))}
          </div>
        </Section>

        <section className="p-6 rounded-lg border bg-muted/50">
          <h2 className="text-lg font-semibold mb-2">Features</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Auto-detection:</strong> Automatically detects YouTube, Vimeo, Loom, Wistia,
              native video, GIF, and Lottie from URLs
            </li>
            <li>
              <strong>Privacy-first:</strong> Uses youtube-nocookie.com and dnt=1 for GDPR
              compliance
            </li>
            <li>
              <strong>Accessibility:</strong> Respects prefers-reduced-motion with static fallbacks
            </li>
            <li>
              <strong>Responsive:</strong> Multiple aspect ratios and responsive source selection
            </li>
            <li>
              <strong>Headless:</strong> Full control with render props for custom implementations
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
