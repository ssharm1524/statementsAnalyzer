/**
 * Represents a monthly analysis with spending details.
 * The analysis includes total spending, spending per merchant, and the month of analysis.
 * 
 * @class MonthlyAnalysis
 */
class MonthlyAnalysis {
  #month;
  #monthIndex; 
  #merchantMap;
  #totalSpending;

  /**
   * Create a new MonthlyAnalysis instance.
   * 
   * @constructor
   * @param {string|number} month - The month of the analysis (as a string or index).
   * @throws {Error} Throws an error for invalid argument types.
   */
  constructor(month) {
    if (typeof month === 'string') {
      this.#month = month;
      this.#monthIndex = MonthlyAnalysis.getMonthIndexByString(month);
    } else if (typeof month === 'number') {
      this.#month = MonthlyAnalysis.getMonthStringByIndex(month);
      this.#monthIndex = month;
    } else {
      console.error('Invalid argument type');
    }
    t
    this.#merchantMap = new Map();
    this.#totalSpending = 0;
  }

  get month() {
    return this.#month;
  }

  get totalSpending() {
    return this.#totalSpending;
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

  // Static method to get the month index from string
  static getMonthIndexByString(month) {
    const months = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ];
    return months.indexOf(month);
  }

  // Static method to get string by index
  static getMonthStringByIndex(index) {
    const months = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ];
    return months[index];
  }


}

export default MonthlyAnalysis;