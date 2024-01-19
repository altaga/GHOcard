export function generateDummyCreditCard(start = "4599") {
    // Generate a random 16-digit credit card number
    const cardNumber =
      start +
      Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
  
    // Generate a random 3-digit CVV code
    const cvv = Array.from({ length: 3 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
  
    // Generate a random expiration date in MM/YY format
    const expirationMonth = String(Math.floor(Math.random() * 12) + 1).padStart(
      2,
      "0"
    );
    const expirationYear = String(Math.floor(Math.random() * 10) + 22);
  
    // Generate a random cardholder name
    const firstNames = ["John", "Jane", "Michael", "Emily"];
    const lastNames = ["Doe", "Smith", "Johnson", "Brown"];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const cardholderName = `${firstName} ${lastName}`;
  
    // Return the generated credit card details as an object
    return {
      cardNumber,
      cvv,
      expirationDate: `${expirationMonth}/${expirationYear}`,
      cardholderName,
    };
  }

  export function convertJsonToArray(jsonObj, selectedKey) {
    return Object.entries(jsonObj).map(([key, value]) => value[selectedKey]);
  }