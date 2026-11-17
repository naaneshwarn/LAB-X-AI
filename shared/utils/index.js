export function formatCurrent(amperes, decimals = 2) {
  if (typeof amperes !== 'number' || Number.isNaN(amperes)) return '0.00 A'
  return `${amperes.toFixed(decimals)} A`
}

export function formatVoltage(volts) {
  return `${volts} V`
}

export function formatResistance(ohms) {
  return `${ohms} Ω`
}
