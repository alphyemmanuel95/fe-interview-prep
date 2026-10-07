import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'

type CopyStatus = 'idle' | 'copied' | 'failed'

const RESET_DELAY_MS = 2000

const ANNOUNCEMENTS: Record<CopyStatus, string> = {
  idle: '',
  copied: 'Link to this view copied.',
  failed: 'Couldn’t copy the link. Copy the URL from the address bar instead.',
}

const LABELS: Record<CopyStatus, string> = {
  idle: 'Copy link',
  copied: 'Copied',
  failed: 'Copy failed',
}

/**
 * Copies the current URL, which holds the whole table view, so the view can
 * be shared. The URL is the source of truth; this only makes it discoverable.
 */
export function CopyLinkButton() {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      window.clearTimeout(resetTimer.current)
    }
  }, [])

  async function handleCopy() {
    window.clearTimeout(resetTimer.current)
    try {
      await navigator.clipboard.writeText(window.location.href)
      setStatus('copied')
    } catch {
      // Clipboard access can be blocked (permissions, insecure context).
      setStatus('failed')
    }
    resetTimer.current = window.setTimeout(() => {
      setStatus('idle')
    }, RESET_DELAY_MS)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void handleCopy()
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Icon
          name={status === 'copied' ? 'check' : 'link'}
          className="size-4"
        />
        {LABELS[status]}
      </button>
      <p role="status" className="sr-only">
        {ANNOUNCEMENTS[status]}
      </p>
    </>
  )
}
