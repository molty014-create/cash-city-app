import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error reporting service in production
    if (import.meta.env.PROD) {
      // TODO: Send to error reporting service (Sentry, etc.)
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0f0d',
          color: '#e2e8f0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#f87171'
          }}>
            Something went wrong
          </h1>
          <p style={{
            fontSize: '1rem',
            marginBottom: '2rem',
            color: '#94a3b8',
            maxWidth: '400px'
          }}>
            We encountered an unexpected error. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
