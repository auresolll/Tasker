const string =
  'https://example.com/path?&orderID=ABC&transactionID=ABC&userID=ABC&transaction_type=ABC';
const allowedParams = [
  'orderID',
  'transactionID',
  'userID',
  'transaction_type',
];

console.log(filterQueryString(string, allowedParams));
