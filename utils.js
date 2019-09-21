module.exports = {
  getFactor(breakpoints, value, opposite = false) {
    let factor;
    for (let i = 0; i < breakpoints.length; i++) {
      if (opposite) {
        if (value < breakpoints[i]) {
          factor = i;
          break;
        }
      } else {
        if (value >= breakpoints[i]) {
          factor = i;
          break;
        }
      }
    }
    if (typeof factor === 'undefined') factor = breakpoints.length;
    return factor;
  },
};
