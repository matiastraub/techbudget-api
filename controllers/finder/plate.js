const puppeteerExtra = require('puppeteer-extra')
const Stealth = require('puppeteer-extra-plugin-stealth')

puppeteerExtra.use(Stealth())

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const main = async (plate) => {
  const browserObj = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ignoreDefaultArgs: ['--disable-extensions'],
  })

  const page = await browserObj.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  )

  const fullUrl = process.env.PLATE_URL
  await page.goto(fullUrl, { waitUntil: 'networkidle0' })

  await page.waitForSelector('#inputTerm', { visible: true })
  await page.click('#inputTerm')
  await page.type('#inputTerm', plate, { delay: 100 })

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
    page.click('#searchBtn'),
  ])

  await delay(2000)

  const rawData = await page.evaluate(() => {
    const data = {}

    const rows = document.querySelectorAll('table tr')
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td, th')
      if (cells.length >= 2) {
        const key = cells[0]?.innerText?.trim()
        const value = cells[1]?.innerText?.trim()
        if (key && value) {
          data[key] = value
        }
      }
    })

    return data
  })

  await browserObj.close()

  // Clean and structure the data
  const cleanData = {
    owner: {
      rut: rawData['RUT'] || null,
      name: rawData['Nombre'] || null,
    },
    vehicle: {
      plate: rawData['Patente'] || plate,
      type: rawData['Tipo'] || null,
      brand: rawData['Marca'] || null,
      model: rawData['Modelo'] || null,
      year: rawData['Año'] ? parseInt(rawData['Año']) : null,
      color: rawData['Color'] !== 'NO DISPONIBLE' ? rawData['Color'] : null,
      motorNumber: rawData['N° Motor'] || null,
      chassisNumber:
        rawData['N° Chasis'] !== 'NO DISPONIBLE' ? rawData['N° Chasis'] : null,
      origin:
        rawData['Procedencia'] !== 'NO DISPONIBLE'
          ? rawData['Procedencia']
          : null,
      manufacturer: rawData['Fabricante'] || null,
    },
    technicalReview: {
      month: rawData['Mes de revisión'] || null,
    },
    insurance: {
      status: rawData['Estado'] || null,
      company: rawData['Compañia'] || null,
      startDate: rawData['Fecha inicio'] || null,
      expirationDate: rawData['Fecha de vencimiento'] || null,
    },
    publicTransport: {
      isPublic: rawData['Transporte público'] === 'SI',
      type:
        rawData['Tipo transporte público'] !== 'NO APLICA'
          ? rawData['Tipo transporte público']
          : null,
    },
    restrictions: {
      hasRestriction: rawData['Condición'] === 'SI',
      puenteAltoSanBernardo:
        rawData['Comunas de Puente Alto y San Bernardo'] !== 'NO APLICA'
          ? rawData['Comunas de Puente Alto y San Bernardo']
          : null,
      santiagoProvince:
        rawData['Provincia de Santiago e interior de anillo de A. Vespucio'] !==
        'NO APLICA'
          ? rawData['Provincia de Santiago e interior de anillo de A. Vespucio']
          : null,
    },
  }

  return cleanData
}

module.exports = main
