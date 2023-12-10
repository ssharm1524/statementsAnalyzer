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

  get merchantMap() {
    return this.#merchantMap;
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

  // Static method to get the month index from string
  static getMonthIndexByString(month) {
    const months = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ];
    return months.indexOf(month);
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

  static combineMerchantMaps(current, newData) {
    if (!newData || newData.size === 0) {
      return;
    }
  
    newData.forEach(({ count, totalAmount }, merchant) => {
      if (current.has(merchant)) {
        // If the current map already has the merchant, update the values
        let currentCount = current.get(merchant).count;
        let currentTotal = current.get(merchant).totalAmount;
        current.set(merchant, { count: currentCount + count, totalAmount: currentTotal + totalAmount });
      } else {
        // If the current map does not have the merchant, add a new entry
        current.set(merchant, { count, totalAmount });
      }
    });
  }
}
module.exports = MonthlyAnalysis;