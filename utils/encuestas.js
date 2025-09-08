const { randomUUID } = require('crypto')

const endReasonTypes = [
  'unjoined',
  'hangup',
  'agent_hangup',
  'timeout',
  'connection_error',
  'system_error',
]

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

  // pick random endReason
  const endReason =
    endReasonTypes[Math.floor(Math.random() * endReasonTypes.length)]

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
      // 80% chance voter chooses someone, 20% chance no choice
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
