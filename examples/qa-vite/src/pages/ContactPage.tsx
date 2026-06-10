export function ContactPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-muted-foreground">Get in touch with the TourKit team</p>
        </header>

        <section
          id="contact-form"
          className="max-w-md mx-auto p-6 rounded-lg border bg-popover shadow-sm"
        >
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="How can we help?"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Send Message
            </button>
          </form>
        </section>

        <section className="text-center text-muted-foreground">
          <p>Or reach us at:</p>
          <p className="font-mono">hello@tourkit.dev</p>
        </section>
      </div>
    </div>
  )
}
