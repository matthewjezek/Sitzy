import React, { useState, useRef, useEffect } from "react"
import { FaXTwitter, FaFacebook, FaWhatsapp } from "react-icons/fa6"
import { FiDownload, FiFileText, FiShare2, FiX, FiLink } from "react-icons/fi"
import { toast } from "react-toastify"
import { useNativeShare } from "../hooks/useNativeShare"
import { 
  getXShareUrl, 
  getFacebookShareUrl, 
  getWhatsAppShareUrl 
} from "../utils/sharePresets"

interface SharePresetProps {
  title: string
  text: string
  url: string
  onDownloadPng: () => Promise<void>
  onExportJson: () => void
  exportingImage?: boolean
  exportingJson?: boolean
  className?: string
  xText: string
  xUrl: string
  fbText: string
  fbUrl: string
  waText: string
  waUrl: string
  onGenerateBlob?: () => Promise<Blob | null>
  onShare?: () => void
}

export const ShareButtonGroup: React.FC<{
  xText: string
  xUrl: string
  fbText: string
  fbUrl: string
  waText: string
  waUrl: string
  onDownloadPng?: () => Promise<void>
}> = ({ xText, xUrl, fbText, fbUrl, waText, waUrl, onDownloadPng }) => {
  const shareLinks = [
    {
      label: 'X (Twitter)',
      icon: <FaXTwitter size={20} />,
      url: getXShareUrl(xText, xUrl),
      color: 'hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-black dark:hover:text-white',
    },
    {
      label: 'Facebook',
      icon: <FaFacebook size={20} />,
      url: getFacebookShareUrl(fbUrl),
      color: 'hover:border-blue-200 dark:hover:border-blue-900/50 hover:text-blue-600',
      onClick: () => {
        if (fbText) {
          navigator.clipboard.writeText(fbText)
            .then(() => {
              toast.info('Text naší cesty byl zkopírován do schránky! Můžeš ho vložit (Ctrl+V) do příspěvku na Facebooku.')
            })
            .catch((err) => {
              console.error('Chyba při kopírování:', err)
            })
        }
      }
    },
    {
      label: 'Facebook Story',
      icon: <FaFacebook size={20} />,
      url: 'https://www.facebook.com',
      color: 'hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:text-indigo-600',
      onClick: (e: React.MouseEvent) => {
        if (onDownloadPng) {
          e.preventDefault()
          toast.info('Generuji a stahuji obrázek pro Facebook Story. Po stažení ho nahraj do svých Příběhů!')
          void onDownloadPng()
          window.open('https://www.facebook.com', '_blank', 'noopener,noreferrer')
        }
      }
    },
    {
      label: 'WhatsApp',
      icon: <FaWhatsapp size={20} />,
      url: getWhatsAppShareUrl(waText, waUrl),
      color: 'hover:border-green-200 dark:hover:border-green-900/50 hover:text-green-500',
    },
    {
      label: 'Kopírovat',
      icon: <FiLink size={20} />,
      url: '#',
      color: 'hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-indigo-600',
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        navigator.clipboard.writeText(xUrl)
          .then(() => {
            toast.success('Odkaz na cestu byl zkopírován do schránky!')
          })
          .catch((err) => {
            console.error('Chyba při kopírování:', err)
          })
      }
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-1.5 py-4">
      {shareLinks.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={link.onClick}
          className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all duration-200 text-zinc-500 dark:text-zinc-400 ${link.color}`}
          aria-label={`Sdílet na ${link.label}`}
        >
          <span className="text-zinc-800 dark:text-zinc-200 transition-colors">
            {link.icon}
          </span>
          <span className="text-[9px] font-semibold tracking-wide text-zinc-600 dark:text-zinc-400 text-center whitespace-normal leading-tight">
            {link.label}
          </span>
        </a>
      ))}
    </div>
  )
}


export const DownloadPresetMenu: React.FC<{
  onDownloadPng: () => Promise<void>
  onExportJson: () => void
  exportingImage?: boolean
  exportingJson?: boolean
}> = ({ onDownloadPng, onExportJson, exportingImage, exportingJson }) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="button-secondary flex items-center gap-2 w-full justify-center h-10"
        aria-expanded={isOpen}
      >
        <FiDownload size={16} />
        <span>Stáhnout</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 right-0 z-50 card p-1 flex flex-col gap-1 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => {
              void onDownloadPng()
              setIsOpen(false)
            }}
            disabled={exportingImage}
            className="flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <FiDownload size={16} className="text-zinc-500" />
            <span>{exportingImage ? 'Připravuji...' : 'Obrázek (PNG)'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onExportJson()
              setIsOpen(false)
            }}
            disabled={exportingJson}
            className="flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <FiFileText size={16} className="text-zinc-500" />
            <span>{exportingJson ? 'Exportuji...' : 'Data (JSON)'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export const ShareModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  title: string
  onDownloadPng: () => Promise<void>
  onExportJson: () => void
  exportingImage?: boolean
  exportingJson?: boolean
  xText: string
  xUrl: string
  fbText: string
  fbUrl: string
  waText: string
  waUrl: string
}> = ({ 
  isOpen, 
  onClose, 
  title, 
  onDownloadPng, 
  onExportJson,
  exportingImage,
  exportingJson,
  xText,
  xUrl,
  fbText,
  fbUrl,
  waText,
  waUrl
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-sm card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors hover:cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        <p className="text-sm text-zinc-500 mb-6">Vyberte způsob sdílení této jízdy.</p>
        
        <ShareButtonGroup
          xText={xText}
          xUrl={xUrl}
          fbText={fbText}
          fbUrl={fbUrl}
          waText={waText}
          waUrl={waUrl}
          onDownloadPng={onDownloadPng}
        />
        
        <div className="mt-8">
          <DownloadPresetMenu 
            onDownloadPng={onDownloadPng}
            onExportJson={onExportJson}
            exportingImage={exportingImage}
            exportingJson={exportingJson}
          />
        </div>
      </div>
    </div>
  )
}

export const SharePreset: React.FC<SharePresetProps> = ({
  title,
  text,
  url,
  onDownloadPng,
  onExportJson,
  exportingImage,
  exportingJson,
  className = '',
  xText,
  xUrl,
  fbText,
  fbUrl,
  waText,
  waUrl,
  onGenerateBlob,
  onShare
}) => {
  const { isMobile, isSupported, share } = useNativeShare()
  const [modalOpen, setModalOpen] = useState(false)

  const handleShare = async () => {
    if (onShare) {
      onShare()
    }
    if (isMobile && isSupported) {
      try {
        if (onGenerateBlob) {
          const toastId = toast.info('Kopíruji odkaz a připravuji kartu...')
          
          // Copy the ride URL to the clipboard for easy Link Sticker creation
          try {
            await navigator.clipboard.writeText(url)
          } catch (clipErr) {
            console.error('Clipboard copy failed:', clipErr)
          }

          const blob = await onGenerateBlob()
          toast.dismiss(toastId)
          if (blob) {
            const file = new File([blob], 'sitzy-cesta.png', { type: 'image/png' })
            const shareData = {
              title,
              text,
              url,
              files: [file]
            }
            if (navigator.canShare && navigator.canShare(shareData)) {
              toast.success('Odkaz je zkopírován ve schránce! Ve svém Story ho můžeš přidat jako nálepku "Odkaz" (Link).', { autoClose: 6000 })
              await navigator.share(shareData)
              return
            }
          }
        }
      } catch (err) {
        console.error('File share failed, falling back to text:', err)
      }

      await share({ title, text, url })
    } else {
      setModalOpen(true)
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleShare}
        className="button-primary flex items-center justify-center gap-2 h-10 px-4 w-full sm:w-auto"
      >
        <FiShare2 size={16} />
        <span>Sdílet</span>
      </button>

      <ShareModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Sdílet jízdu"
        onDownloadPng={onDownloadPng}
        onExportJson={onExportJson}
        exportingImage={exportingImage}
        exportingJson={exportingJson}
        xText={xText}
        xUrl={xUrl}
        fbText={fbText}
        fbUrl={fbUrl}
        waText={waText}
        waUrl={waUrl}
      />
    </div>
  )
}
