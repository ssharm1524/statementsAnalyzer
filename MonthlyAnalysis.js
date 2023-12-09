/**
 * Represents a monthly analysis with spending details.
 * The analysis includes total spending, spending per merchant, and the month of analysis.
 * 
 * @class MonthlyAnalysis
 */
class MonthlyAnalysis {
  #month;
  #merchantMap;
  #totalSpending;

  /**
   * Create a new MonthlyAnalysis instance.
   * 
   * @constructor
   * @param {number} month - The month of the analysis.
   * @throws {Error} Throws an error for invalid argument types.
   */
  constructor(month) {
    this.#month = month;
    this.#merchantMap = new Map();
    this.#totalSpending = 0;
  }

  get month() {
    return this.#month;
  }

  get totalSpending() {
    return this.#totalSpending;
  }

   setMonth(month) {
    this.#month = month;
  }

  setMerchantMap(merchantMap) {
    this.#merchantMap = merchantMap;
  }

  setTotalSpending(totalSpending) {
    this.#totalSpending = totalSpending;
  }

  updateTotalSpending(amount) {
    this.#totalSpending += amount;
  }

  getMerchantSpending(merchant) {
    return this.#merchantMap.get(merchant) ?? 0;
  }

  addMerchantSpending(merchant, amount) {
    if (this.#merchantMap.has(merchant)) {
      const merchantData = this.#merchantMap.get(merchant);
      merchantData.count += 1;
      merchantData.totalAmount += amount;
    } else {
      this.#merchantMap.set(merchant, { count: 1, totalAmount: amount });
    }
  }

  hasMerchant(merchant) {
    return this.#merchantMap.has(merchant);
  }

  deleteMerchant(merchant) {
    this.#merchantMap.delete(merchant);
  }

  getAllMerchants() {
    return Array.from(this.#merchantMap.keys());
  }

  getAllSpendingValues() {
    return Array.from(this.#merchantMap.values());
  }

  getAllMerchantEntries() {
    return Array.from(this.#merchantMap.entries());
  }

  getMerchantByHighestSpent() {
    let maxAmount = 0;
    let maxMerchant = null;

    this.#merchantMap.forEach((data,merchant) => {
      if (data.totalAmount > maxAmount) {
        maxAmount = data.totalAmount;
        maxMerchant = merchant;
      }
    });

    return maxMerchant;
  }

  getMerchantByHighestFreq () {
    let maxCount = 0;
    let maxMerchant = null;

    this.#merchantMap.forEach((data,merchant) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        maxMerchant = merchant;
      }
    });

    return maxMerchant;
  }

  /**
   * Convert the MonthlyAnalysis instance to a JSON representation.
   * 
   * @returns {Object} The JSON representation of the MonthlyAnalysis.
   */
  toJSON() {
    return {
      month: this.#month,
      merchantMap: Array.from(this.#merchantMap.entries()),
      totalSpending: this.#totalSpending
    };
  }

  /**
   * Create a MonthlyAnalysis instance from a JSON representation.
   * 
   * @static
   * @param {Object} json - The JSON representation of the MonthlyAnalysis.
   * @returns {MonthlyAnalysis} The MonthlyAnalysis instance created from the JSON.
   */
  static fromJSON(json) {
    const { month, totalSpending, merchantMap} = json;
    const analysis = new MonthlyAnalysis(month);
    
    analysis.#month = month;
    analysis.#totalSpending = totalSpending;
    analysis.#merchantMap = new Map(merchantMap);

    return analysis;
  }
}
module.exports = MonthlyAnalysis;