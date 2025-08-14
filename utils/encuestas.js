exports.generateFakeCall = () => {
  const candidates = [
    'Evelyn Mattei',
    'Janet Jara',
    'Johannes Kaiser',
    'Franco Parisi',
    'José Antonio Kast',
    'Nadie',
  ]
  const now = new Date()

  const isJoined = Math.random() < 0.8 // 80% chance the call was joined
  const joinTimeout = '30s'
  const maxDuration = '1200s'

  if (isJoined) {
    const joined = new Date(now.getTime() + 20 * 1000)
    const ended = new Date(joined.getTime() + 110 * 1000)

    return {
      created: now.toISOString(),
      joined,
      ended,
      joinTimeout,
      maxDuration,
      endReason: 'hangup',
      errorCount: 0,
      shortSummary: `El votante prefirió a ${candidates[Math.floor(Math.random() * candidates.length)]}`,
      summary: 'Simulación automática.',
    }
  } else {
    const ended = new Date(now.getTime() + 43 * 1000) // e.g., 43s later
    return {
      created: now.toISOString(),
      joined: null,
      ended: ended.toISOString(),
      joinTimeout,
      maxDuration,
      endReason: 'unjoined',
      errorCount: 0,
      shortSummary: null,
      summary: null,
    }
  }
}

exports.fixData = [
  {
    created: '2025-08-04T13:27:03.381746Z',
    ended: '2025-08-04T13:29:14.250613Z',
    endReason: 'hangup',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1362s',
    joined: '2025-08-04T13:27:24.918100Z',
    shortSummary:
      'La encuesta telefónica determinó que el candidato preferido del votante es Evelyn Mattei',
    summary:
      'La agente Lily realizó una encuesta telefónica para conocer las preferencias del votante sobre los candidatos presidenciales en Chile. Inicialmente, el votante mencionó un nombre que no estaba en la lista, pero después de proporcionar la lista completa de candidatos, el votante seleccionó a Evelyn Mattei como su candidato preferido. La encuesta se llevó a cabo de manera eficiente y respetuosa, y la agente agradeció la participación del votante. La llamada finalizó después de confirmar la preferencia del votante por Evelyn Mattei.',
  },
  {
    created: '2025-08-04T01:23:55.771192Z',
    ended: '2025-08-04T01:24:57.708760Z',
    endReason: 'hangup',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1405s',
    joined: '2025-08-04T01:24:14.426972Z',
    shortSummary:
      'La encuesta telefónica con Lily determinó que el candidato preferido del votante es Evelyn Mattei.',
    summary:
      'Lily, la agente de la encuesta, contactó al votante y le preguntó sobre su candidato presidencial preferido en Chile. El votante respondió rápidamente que su candidato preferido es Evelyn Mattei. Lily confirmó la respuesta y agradeció la participación del votante en la encuesta. La llamada fue breve y se centró exclusivamente en determinar la preferencia del votante.',
  },
  {
    created: '2025-07-28T13:58:40.126776Z',
    ended: '2025-07-28T13:59:57.346677Z',
    endReason: 'hangup',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1466s',
    joined: '2025-07-28T13:58:55.726175Z',
    shortSummary:
      'La encuesta telefónica fue respondida por un votante que prefirió a Evelyn Mattei como candidata presidencial',
    summary:
      'Lily, la agente de la encuesta, contactó a un votante y le explicó el propósito de la llamada. El votante expresó su preferencia por Evelyn Mattei como candidata presidencial sin necesidad de que se le proporcionara la lista de opciones. La agente confirmó la respuesta y agradeció la participación del votante en la encuesta. La llamada fue breve y se llevó a cabo de manera eficiente y respetuosa.',
  },
  {
    created: '2025-07-28T01:29:07.192480Z',
    ended: '2025-07-28T01:30:17.801397Z',
    endReason: 'hangup',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1523s',
    joined: '2025-07-28T01:29:21.035019Z',
    shortSummary:
      'La encuesta telefónica con Lily resultó en que el encuestado prefirió a Janet Hara como candidata presidencial',
    summary:
      'Lily, la agente de la encuesta, contactó al encuestado y explicó el propósito de la llamada, que era conocer su preferencia entre los candidatos presidenciales en Chile. El encuestado respondió que su candidata preferida era Janet Hara, del Partido Comunista. Lily confirmó la respuesta y agradeció el tiempo del encuestado, finalizando la llamada de manera educada. La encuesta se llevó a cabo de manera breve y respetuosa, sin incidentes ni desviaciones del guion establecido.',
  },
  {
    created: '2025-07-27T16:03:02.605909Z',
    ended: '2025-07-27T16:04:24.091408Z',
    endReason: 'hangup',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1581s',
    joined: '2025-07-27T16:03:26.270815Z',
    shortSummary:
      'Lily realizó una encuesta telefónica para conocer la preferencia del votante sobre los candidatos presidenciales en Chile y el votante seleccionó a José Antonio Kast como su candidato preferido.',
    summary:
      'Lily, una agente de encuestas, realizó una llamada telefónica para conocer la preferencia del votante sobre los candidatos presidenciales en Chile. El votante respondió que su candidato preferido era José Antonio Kast. Lily confirmó la respuesta y agradeció al votante por su tiempo y opinión. La llamada fue breve y se centró exclusivamente en la encuesta, finalizando con un agradecimiento y un adiós.',
  },
  {
    created: '2025-07-27T15:08:22.624699Z',
    ended: '2025-07-27T15:09:49.230782Z',
    endReason: 'hangup',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1647s',
    joined: '2025-07-27T15:08:42.815226Z',
    shortSummary:
      'Lily realizó una encuesta telefónica para conocer la preferencia del votante sobre los candidatos presidenciales en Chile, y el votante seleccionó a Johannes Kaiser como su candidato preferido.',
    summary:
      'Lily se presentó y explicó el propósito de la encuesta, preguntando al votante sobre su candidato preferido para la presidencia de Chile. El votante respondió que su candidato preferido era Johannes Kaiser. Lily confirmó la respuesta leyendo la lista de candidatos y el votante reiteró su preferencia por Johannes Kaiser. La encuesta finalizó con un agradecimiento y la confirmación de la preferencia del votante.',
  },
  {
    created: '2025-07-18T22:02:42.883368Z',
    ended: '2025-07-18T22:03:20.320383Z',
    endReason: 'unjoined',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1647s',
    joined: null,
    shortSummary: null,
    summary: null,
  },
  {
    created: '2025-07-18T22:01:48.110517Z',
    ended: '2025-07-18T22:02:31.253255Z',
    endReason: 'unjoined',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1647s',
    joined: null,
    shortSummary: null,
    summary: null,
  },
  {
    created: '2025-07-18T21:58:01.604288Z',
    ended: '2025-07-18T21:58:31.978283Z',
    endReason: 'unjoined',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1647s',
    joined: null,
    shortSummary: null,
    summary: null,
  },
  {
    created: '2025-07-18T21:53:06.805116Z',
    ended: '2025-07-18T21:53:46.824609Z',
    endReason: 'unjoined',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1647s',
    joined: null,
    shortSummary: null,
    summary: null,
  },
  {
    created: '2025-07-18T16:39:06.327153Z',
    ended: '2025-07-18T16:40:43.116859Z',
    endReason: 'hangup',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1726s',
    joined: '2025-07-18T16:39:24.448249Z',
    shortSummary:
      'Lily realizó una encuesta telefónica para conocer la preferencia del votante sobre los candidatos presidenciales en Chile, y el votante seleccionó a Evelyn Mattei como su candidato preferido.',
    summary:
      "Lily, la agente de encuesta, contactó al votante y explicó el propósito de la llamada, que era conocer su preferencia entre los candidatos presidenciales en Chile. Inicialmente, el votante mencionó a 'Pinerá', pero como no estaba en la lista, Lily proporcionó la lista de candidatos y el votante seleccionó a Evelyn Mattei. La agente confirmó la selección y agradeció al votante por su tiempo y participación en la encuesta. Finalmente, la llamada terminó de manera amigable y eficiente.",
  },
  {
    created: '2025-07-18T13:59:57.612307Z',
    ended: '2025-07-18T14:01:28.959718Z',
    endReason: 'hangup',
    errorCount: 0,
    joinTimeout: '30s',
    maxDuration: '1800s',
    joined: '2025-07-18T14:00:15.089796Z',
    shortSummary:
      'La encuesta telefónica concluyó con el usuario seleccionando a Johannes Kaiser como su candidato preferido',
    summary:
      'Lily, la agente de la encuesta, contactó al usuario y le explicó el propósito de la llamada. El usuario inicialmente expresó que no tenía un candidato preferido, pero después de que Lily proporcionó la lista de candidatos, seleccionó a Johannes Kaiser. La agente confirmó la selección del usuario y agradeció su tiempo y colaboración. La encuesta se llevó a cabo de manera eficiente y respetuosa, sin incidentes ni desviaciones del guion establecido.',
  },
]
