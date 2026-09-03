// Matching an inbound class to the request that is waiting for it (FOUND-01).
//
// The rules are grid-editor's validate_incoming (engine.store.ts:377-434), in
// its order, with the line each one comes from recorded beside it. Two changes:
// the comparisons are strict after a numeric coercion (the desktop's loose
// equality exists because its decoder produced strings), and the request id is
// applied as an explicit argument instead of the null filter placeholder the
// desktop overwrote in place.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { DecodedClass } from "./decode";
import type { ResponseFilter } from "./descriptors";

export type MatchResult = "ok" | "nack" | "no";

/**
 * Decide what an inbound class means for the request currently waiting.
 *
 * `expectedId` is passed only when the request's `correlateById` is true, which
 * the descriptors set only for acknowledgement filters.
 */
export function matchResponse(
  cls: DecodedClass,
  filter: ResponseFilter,
  expectedId?: number,
): MatchResult {
  // :382-384. First, always. A module heartbeats four times a second and would
  // satisfy a loose filter long before its real response arrived.
  if (cls.class_name === "HEARTBEAT") return "no";

  // :389-399. Every frame carries a BRC header, so the address is checked
  // before anything else about the class.
  for (const [key, value] of Object.entries(filter.brc_parameters ?? {})) {
    if (Number(cls.brc_parameters[key]) !== Number(value)) return "no";
  }

  // :401-413. A negative acknowledgement is a rejection, not a timeout: the
  // queue resolves it as a distinct outcome and never retries it.
  if (cls.class_instr === "NACKNOWLEDGE") {
    if (cls.class_name !== filter.class_name) return "no";
    if (
      expectedId !== undefined &&
      Number(cls.class_parameters.LASTHEADER) !== expectedId
    ) {
      return "no";
    }
    return "nack";
  }

  if (
    cls.class_name !== filter.class_name ||
    cls.class_instr !== filter.class_instr
  ) {
    return "no";
  }

  // :415-429. A parameter the incoming class does not carry decodes as
  // undefined, coerces to NaN and fails this comparison - which is why an
  // acknowledgement filter names no class parameters at all.
  for (const [key, value] of Object.entries(filter.class_parameters ?? {})) {
    if (Number(cls.class_parameters[key]) !== Number(value)) return "no";
  }

  // Firmware echoes the request BRC id into CLASS_CONFIG_LASTHEADER on ACK and
  // NACK (grid_decode.c:1307) and into CLASS_PAGESTORE_LASTHEADER (:947). On a
  // REPORT those same two bytes at offset 5 are VERSIONMAJOR, so correlating a
  // report on them would reject every fetch - or accept one by coincidence when
  // the id happened to equal the firmware's protocol major.
  if (
    expectedId !== undefined &&
    Number(cls.class_parameters.LASTHEADER) !== expectedId
  ) {
    return "no";
  }

  return "ok";
}
