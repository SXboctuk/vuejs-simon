export function promiseQueue(promiseFuctionList) {
  return new Promise((resolve, reject) => {
    const output = [];

    next(promiseFuctionList.shift());

    function next(promise) {
      if (promise) {
        promise()
          .then((result) => {
            output.push(result);
            next(promiseFuctionList.shift());
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        resolve(output);
      }
    }
  });
}
