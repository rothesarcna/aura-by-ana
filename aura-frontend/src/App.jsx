
import Dashboard from './pages/Dashboard'

function App() {
  return <Dashboard />
}

export default App


/*
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">A</span>
          <span>AURA</span>
        </a>

        <nav>
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>

        <button
          className="login-button"
          onClick={() => alert('Login will be added later!')}
        >
          Get Started
        </button>
      </header>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-content">
            <span className="eyebrow">YOUR ACADEMIC PROJECT COMPANION</span>

            <h1>
              Know what to do
              <br />
              <span>next.</span>
            </h1>

            <p>
              Keep your academic projects organized. Track submissions,
              understand instructor feedback, and turn revisions into
              manageable tasks — all in one place.
            </p>

            <a className="primary-button" href="#features">
              Explore AURA <span>→</span>
            </a>

            <div className="hero-note">
              <span className="status-dot"></span>
              Your projects, feedback, and next steps in one place
            </div>
          </div>

          <div className="preview-card">
            <div className="preview-header">
              <div>
                <span className="preview-label">PROJECT OVERVIEW</span>
                <h2>My Workspace</h2>
              </div>
              <span className="avatar">S</span>
            </div>

            <div className="progress-card">
              <div className="progress-top">
                <span>Research Project</span>
                <span className="status-badge">In Progress</span>
              </div>
              <p>Chapter 1 — Introduction</p>
              <div className="progress-track">
                <div className="progress-fill"></div>
              </div>
              <small>60% complete</small>
            </div>

            <div className="next-action">
              <div className="action-icon">✓</div>
              <div>
                <span className="preview-label">YOUR NEXT ACTION</span>
                <h3>Revise the research objectives</h3>
                <p>Based on your instructor's feedback</p>
              </div>
            </div>

            <div className="feedback-card">
              <span className="feedback-mark">“</span>
              <div>
                <span className="preview-label">INSTRUCTOR FEEDBACK</span>
                <p>
                  Clarify the objectives and make sure they align with your
                  research questions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">MADE FOR STUDENT PROJECTS</span>
            <h2>Less confusion. More progress.</h2>
            <p>
              A clearer way to manage your academic work from submission
              to revision.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">01</div>
              <h3>Organize Projects</h3>
              <p>
                Keep your project components and submissions organized in
                one workspace.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">02</div>
              <h3>Track Feedback</h3>
              <p>
                Review instructor comments and follow the status of each
                submission.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">03</div>
              <h3>Know Your Next Step</h3>
              <p>
                Turn feedback into specific revision tasks so you know
                what needs to be done next.
              </p>
            </article>
          </div>
        </section>

        <section className="about-section" id="about">
          <span className="eyebrow">ABOUT AURA</span>
          <h2>Feedback should lead to action.</h2>
          <p>
            AURA stands for Academic Updates, Revisions, and Actions. It
            helps students keep track of what they submitted, what needs
            improvement, and what they should do next.
          </p>
        </section>
      </main>

      <footer className="footer">
        <a className="brand" href="#home">
          <span className="brand-icon">A</span>
          <span>AURA</span>
        </a>
        <p>Academic Updates, Revisions, and Actions</p>
      </footer>
    </div>
  )
}

export default App
*/