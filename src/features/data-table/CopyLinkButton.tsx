import { useEffect, useState } from 'react'
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
  // Counts copy attempts so a repeat click restarts the reset timer even
  // when the status itself does not change.
  const [copyCount, setCopyCount] = useState(0)

  useEffect(() => {
    if (status === 'idle') {
      return
    }
    const timerId = window.setTimeout(() => {
      setStatus('idle')
    }, RESET_DELAY_MS)
    return () => {
      window.clearTimeout(timerId)
    }
  }, [status, copyCount])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setStatus('copied')
    } catch {
      // Clipboard access can be blocked (permissions, insecure context).
      setStatus('failed')
    }
    setCopyCount((count) => count + 1)
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
