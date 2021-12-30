import {
  PLAYER_MINT_TIMESTAMP,
  PLAYERS_COUNT,
  INCUBATION_COOLDOWN_MILLIS,
  INCUBATION_DURATION_MILLIS,
} from './constants'
import { Incubation, RanchName } from './types'

export function calculateRemainingCooldown(
  incubationEnds: number,
  currentTimestamp = Date.now(),
  incubationDuration: number = INCUBATION_DURATION_MILLIS,
  incubationCooldown: number = INCUBATION_COOLDOWN_MILLIS
) {
  const remainingMillis =
    incubationEnds - incubationDuration + incubationCooldown - currentTimestamp

  return remainingMillis > 0 ? remainingMillis : 0
}

export function calculateRemainingDuration(
  incubationEnds: number,
  currentTimestamp = Date.now(),
  incubationDuration: number = INCUBATION_DURATION_MILLIS
) {
  const remainingMillis = incubationEnds - currentTimestamp

  return remainingMillis > 0 ? remainingMillis : 0
}

export function getIncubationExtendedFromBase(incubation: Incubation) {
  return (
    incubation && {
      ...incubation,
      remainingCooldown: calculateRemainingCooldown(incubation.ends),
      remainingDuration: calculateRemainingDuration(incubation.ends),
    }
  )
}

export function getRanchFromIndex(index: number) {
  const ranchIndex = index % PLAYERS_COUNT
  return RanchName[ranchIndex]
}

export function fromHexToUint8Array(hex: string) {
  return Uint8Array.from(Buffer.from(hex.substring(2).padStart(64, '0'), 'hex'))
}

export function isTimeToMint() {
  return Date.now() >= PLAYER_MINT_TIMESTAMP * 1000
}

export function printRemainingMillis(millis: number) {
  const seconds = Math.ceil(millis / 1000)
  if (seconds < 60) {
    return `${seconds} sec`
  } else {
    return `${Math.ceil(seconds / 60)} min`
  }
}
