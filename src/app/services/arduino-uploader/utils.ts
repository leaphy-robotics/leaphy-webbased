

export const includesAll = (values, array) => {
  return values.every((value) => {
    return array.includes(value)
  })
}

export function convertArrayToHex(array) {
  return array.map((value) => {
    return value.toString(16)
  })
}

export const delay = (timeOut) => {
  // @ts-ignore
  return new Promise((resolve) => {
    setTimeout(resolve, timeOut)
  })
}
