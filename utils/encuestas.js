const { randomUUID } = require('crypto')

const endReasonWeights = {
  unjoined: 0.3, // 30%
  hangup: 0.3, // 30%
  agent_hangup: 0.3, // 30%
  timeout: 0.05, // 5%
  connection_error: 0.025, // 2.5%
  system_error: 0.025, // 2.5%
}

// Helper to pick weighted random
function pickWeighted(weights) {
  const rnd = Math.random()
  let sum = 0
  for (const [key, weight] of Object.entries(weights)) {
    sum += weight
    if (rnd < sum) return key
  }
}

exports.generateFakeCall = () => {
  const candidates = [
    'Evelyn Mattei',
    'Janet Jara',
    'Johannes Kaiser',
    'Franco Parisi',
    'José Antonio Kast',
  ]

  const now = new Date()
  const joinTimeout = '30s'
  const maxDuration = '1200s'

  // pick random endReason with weights
  const endReason = pickWeighted(endReasonWeights)

  let joined = null
  let ended = null
  let shortSummary = null
  let summary = null

  if (endReason === 'unjoined') {
    ended = new Date(now.getTime() + 40 * 1000).toISOString()
  } else {
    joined = new Date(now.getTime() + 20 * 1000).toISOString()
    ended = new Date(new Date(joined).getTime() + 110 * 1000).toISOString()

    if (endReason === 'hangup' || endReason === 'agent_hangup') {
      // 80% chance voter chooses someone
      const choseCandidate = Math.random() < 0.8

      if (choseCandidate) {
        const candidate =
          candidates[Math.floor(Math.random() * candidates.length)]
        shortSummary = `El votante prefirió a ${candidate}`
        summary = `Simulación automática de encuesta. El votante seleccionó a ${candidate} como su candidato preferido.`
      } else {
        shortSummary = 'El votante no eligió a ningún candidato'
        summary =
          'Simulación automática de encuesta. El votante escuchó la lista de candidatos, pero no expresó preferencia por ninguno.'
      }
    }
  }

  return {
    callId: randomUUID(),
    created: now.toISOString(),
    joined,
    ended,
    joinTimeout,
    maxDuration,
    endReason,
    errorCount: 0,
    shortSummary,
    summary,
  }
}
