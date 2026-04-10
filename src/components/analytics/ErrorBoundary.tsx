import { Component, ReactNode } from 'react'
import posthog from 'posthog-js'

interface Props {
  children: ReactNode
  name?: string
}

interface State {
  hasError: boolean
}

/**
 * Catches React render errors and forwards them to PostHog.
 * autocapture_exceptions handles unhandled JS errors; this covers
 * errors that occur inside the React render cycle, which that misses.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    posthog.captureException(error, {
      component: this.props.name ?? 'App',
    })
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
