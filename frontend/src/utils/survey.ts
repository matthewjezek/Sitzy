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
