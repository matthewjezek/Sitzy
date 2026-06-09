import { formatLocalDateTime } from './datetime'

export type SharePresetId = 'x_compact' | 'facebook_story' | 'messenger_whatsapp_text_first'

export interface SharePreset {
  id: SharePresetId
  label: string
  description?: string
}

export const SHARE_PRESETS: SharePreset[] = [
  { id: 'x_compact', label: 'X — stručně' },
  { id: 'facebook_story', label: 'Facebook Story' },
  { id: 'messenger_whatsapp_text_first', label: 'Text (Messenger/WhatsApp)' },
]

type RideLike = {
  id: string
  destination: string
  departure_time: string
}

export function generateSharePayload(presetId: SharePresetId, ride: RideLike) {
  const link = `${window.location.origin}/rides/${ride.id}`
  const departure = formatLocalDateTime(ride.departure_time)

  switch (presetId) {
    case 'x_compact':
      return {
        title: `Cesta do ${ride.destination}`,
        text: `Organizace sedadel na společnou cestu do: ${ride.destination}. Vyrážíme ${departure}. Vyber si své místo zde:`,
        link,
      }

    case 'facebook_story':
      return {
        title: `Cesta do ${ride.destination}`,
        text: `Jedete s námi do: ${ride.destination}? Odjezd je ${departure}. Mrkněte na obsazenost auta a zapište se na volné sedadlo v Sitzy:`,
        link,
      }

    case 'messenger_whatsapp_text_first':
      return {
        title: `Rozdělení sedadel — ${ride.destination}`,
        text: `Ahoj! Tady je odkaz na rozdělení míst v autě na naši cestu do: ${ride.destination} (${departure}). Zapište se prosím na volná sedadla:`,
        link,
      }

    default:
      return {
        title: `Cesta do ${ride.destination}`,
        text: `Obsazenost sedadel pro společnou cestu do: ${ride.destination} Odjezd: ${departure}. Vyber si své místo:`,
        link,
      }
  }
}

/**
 * X (Twitter) Share intent
 */
export const getXShareUrl = (text: string, url: string) => {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

/**
 * Facebook Share intent
 */
export const getFacebookShareUrl = (url: string, quote?: string) => {
  let finalUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  if (quote) {
    finalUrl += `&quote=${encodeURIComponent(quote)}`
  }
  return finalUrl
}

/**
 * WhatsApp Share intent
 */
export const getWhatsAppShareUrl = (text: string, url: string, isBusiness = false) => {
  const baseUrl = isBusiness ? 'https://api.whatsapp.com/send' : 'https://wa.me/'
  return `${baseUrl}?text=${encodeURIComponent(text + ' ' + url)}`
}
