function quickselect(arr, k) {
  if (arr.length <= 1) return arr[0];

  const pivot = arr[Math.floor(Math.random() * arr.length)];
  const lows = arr.filter((x) => x < pivot);
  const highs = arr.filter((x) => x > pivot);
  const pivots = arr.filter((x) => x === pivot);

  if (k < lows.length) {
    return quickselect(lows, k);
  } else if (k < lows.length + pivots.length) {
    return pivot;
  } else {
    return quickselect(highs, k - lows.length - pivots.length);
  }
}

// Function to calculate median
export function calculateMedian(arr) {
  const mid = Math.floor(arr.length / 2);

  if (arr.length % 2 === 0) {
    // If even, average the two middle numbers
    const leftMid = quickselect(arr, mid - 1);
    const rightMid = quickselect(arr, mid);
    return (leftMid + rightMid) / 2;
  } else {
    // If odd, return the middle number
    return quickselect(arr, mid);
  }
}
