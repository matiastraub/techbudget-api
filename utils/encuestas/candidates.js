const candidatosShort = [
  'Kaiser',
  'Jara',
  'Kast',
  'Matthei',
  'Parisi',
  // 'Mayne-Nicholls',
  // 'MEO',
  // 'Artés'
]

const candidatosLong = [
  'Johannes Kaiser',
  'Jeannette Jara',
  'José Antonio Kast',
  'Evelyn Matthei',
  'Franco Parisi',
  // 'Harold Mayne-Nicholls',
  // 'MEO', //'Marco Enriquez Ominami',
  // 'Eduardo Artés'
]

exports.extractCandidate = (text, long = false) => {
  if (!text) return null
  const candidatos = long ? candidatosLong : candidatosShort

  const match = text.match(
    /\b(Johannes|Kaiser|H[ae]ra|J[ae]ra|Evelyn|Matthei|Kast|José Antonio|Franco|Parisi)\b/i
  )

  if (!match) return null

  const value = match[0].toLowerCase()
  if (['hara', 'hera', 'jara'].includes(value)) {
    return candidatos[1]
  } else if (value === 'kaiser' || value === 'johannes') {
    return candidatos[0]
  } else if (
    value === 'jose' ||
    value === 'josé' ||
    value === 'josé antonio' ||
    value === 'jose antonio' ||
    value === 'kast'
  ) {
    return candidatos[2]
  } else if (value === 'evelyn' || value === 'mattei') {
    return candidatos[3]
  } else if (value === 'franco' || value === 'parisi') {
    return candidatos[4]
  }
  return match[0]
}
