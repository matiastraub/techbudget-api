const { fixCategories } = require('../constants/categories')

const predictTransactionCost = (cost, category) => {
  if (cost) return cost
  if (fixCategories.includes(category)) {
    return 'Fix'
  }
  return 'Var'
}

module.exports = { predictTransactionCost }
