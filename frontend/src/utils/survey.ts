/**
 * Helper to report study tasks/checkpoints completion to the Cloudflare Worker at the Edge.
 * Checks for survey_token in localStorage and performs a POST request.
 */
export function completeTask(checkpointName: string) {
  // Store it in localStorage for the floating checklist widget
  const completed = JSON.parse(localStorage.getItem('survey_completed_checkpoints') || '[]') as string[]
  if (!completed.includes(checkpointName)) {
    completed.push(checkpointName)
    localStorage.setItem('survey_completed_checkpoints', JSON.stringify(completed))
    window.dispatchEvent(new Event('survey:checkpoints_updated'))
  }

  const token = localStorage.getItem('survey_token')
  if (!token) {
    console.debug(`[Survey] Checkpoint '${checkpointName}' not reported: no survey_token in localStorage.`)
    return
  }

  fetch('/api/checkpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: token,
      checkpointName: checkpointName
    })
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Edge returned status ${res.status}`)
      }
      return res.json()
    })
    .then(data => {
      console.log(`[Survey] Checkpoint '${checkpointName}' successfully saved to KV:`, data)
    })
    .catch(err => {
      console.error(`[Survey] Failed to save checkpoint '${checkpointName}':`, err)
    })
}

export async function startSurveySession(user: {
  social_accounts?: Array<{ provider: string; social_id: string }>
  full_name: string | null
}) {
  const token = localStorage.getItem('survey_token')
  if (!token) {
    console.debug('[Survey] startSurveySession skipped: no survey_token in localStorage.')
    return
  }

  const activeAccount = user.social_accounts?.[0]
  if (!activeAccount) {
    console.debug('[Survey] startSurveySession skipped: no social accounts found.')
    return
  }

  try {
    const res = await fetch('/api/start-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: activeAccount.provider,
        existingToken: token
      })
    })
    if (!res.ok) {
      throw new Error(`Edge returned status ${res.status}`)
    }
    const data = await res.json()
    console.log('[Survey] Session successfully initialized in KV:', data)
  } catch (err) {
    console.error('[Survey] Failed to initialize survey session in KV:', err)
  }
}

