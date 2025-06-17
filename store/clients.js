const clients = []

function addClient(req, res) {
  clients.push({ id: req?.query?.id, res })
}

function removeClient(req) {
  const id = req?.query?.id
  if (id) {
    clients.splice(clients.find((client) => client.id == req.query.id))
  }
}

function sendEvent(userId, data) {
  clients.forEach((client) => {
    if (userId) client.id = userId
    client.res.write(`data: ${JSON.stringify(data)}\n\n`)
  })
}

module.exports = {
  addClient,
  removeClient,
  sendEvent,
}
