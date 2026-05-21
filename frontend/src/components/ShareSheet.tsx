import { useEffect, useRef, useState } from 'react'
import { FiCopy, FiDownload, FiFileText, FiMoreVertical, FiShare2 } from 'react-icons/fi'

interface ShareSheetProps {
  nativeShareSupported: boolean
  sharing: boolean
  copyingText: boolean
  copyingLink: boolean
  exportingImage: boolean
  exportingJson: boolean
  onShare: () => Promise<void>
  onCopyText: () => Promise<void>
  onCopyLink: () => Promise<void>
  onDownloadPng: () => Promise<void>
  onExportJson: () => void
}

export default function ShareSheet({
  nativeShareSupported,
  sharing,
  copyingText,
  copyingLink,
  exportingImage,
  exportingJson,
  onShare,
  onCopyText,
  onCopyLink,
  onDownloadPng,
  onExportJson,
}: ShareSheetProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return

    const handleOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  const handlePrimaryShare = () => {
    if (nativeShareSupported) {
      void onShare()
      return
    }
    setMenuOpen((prev) => !prev)
  }

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      <button
        type="button"
        onClick={handlePrimaryShare}
        disabled={sharing}
        className="button-primary flex items-center justify-center gap-2 h-10"
      >
        <FiShare2 size={16} aria-hidden="true" />
        {sharing ? 'Sdílím...' : 'Sdílet'}
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="button-secondary h-10 w-10 flex p-0 items-center justify-center"
        aria-expanded={menuOpen}
        aria-controls="share-menu"
        aria-label="Další možnosti sdílení"
      >
        <FiMoreVertical size={16} aria-hidden="true" />
      </button>

      {menuOpen ? (
        <div
          id="share-menu"
          className="absolute top-12 right-0 z-20 card p-2 min-w-56 flex flex-col gap-1"
          aria-label="Možnosti sdílení"
        >
          <button
            type="button"
            onClick={() => {
              void onCopyText()
              setMenuOpen(false)
            }}
            disabled={copyingText}
            className="button-secondary h-10 flex items-center justify-start gap-2"
          >
            <FiCopy size={16} aria-hidden="true" />
            {copyingText ? 'Kopíruji text...' : 'Kopírovat text'}
          </button>

          <button
            type="button"
            onClick={() => {
              void onCopyLink()
              setMenuOpen(false)
            }}
            disabled={copyingLink}
            className="button-secondary h-10 flex items-center justify-start gap-2"
          >
            <FiCopy size={16} aria-hidden="true" />
            {copyingLink ? 'Kopíruji odkaz...' : 'Kopírovat odkaz'}
          </button>

          <button
            type="button"
            onClick={() => {
              void onDownloadPng()
              setMenuOpen(false)
            }}
            disabled={exportingImage}
            className="button-secondary h-10 flex items-center justify-start gap-2"
          >
            <FiDownload size={16} aria-hidden="true" />
            {exportingImage ? 'Připravuji PNG...' : 'Stáhnout PNG'}
          </button>

          <button
            type="button"
            onClick={() => {
              onExportJson()
              setMenuOpen(false)
            }}
            disabled={exportingJson}
            className="button-secondary h-10 flex items-center justify-start gap-2"
          >
            <FiFileText size={16} aria-hidden="true" />
            {exportingJson ? 'Exportuji JSON...' : 'Exportovat JSON'}
          </button>
        </div>
      ) : null}
    </div>
  )
}