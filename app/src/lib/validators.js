export const passwordStrength = (value) => {
  // Minimum of 1 Uppercase Letter
  if (/[A-Z]/.test(value) === false) { return false }

  // Minimum of 1 Uppercase Letter
  if (/[a-z]/.test(value) === false) { return false }

  // Minimum of 1 Number
  if (/\d/.test(value) === false) { return false }

  return true
}

export const email = (value) => {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ // eslint-disable-line
  return re.test(String(value))
}
