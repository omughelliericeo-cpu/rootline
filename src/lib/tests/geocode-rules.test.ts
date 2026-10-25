// Tests for reading address-lookup answers.
import { describe, expect, it } from "vitest";
import { closestMatch, distanceKm, mapLink, normaliseAddress, parseNominatim } from "../geocode-rules";

describe("parseNominatim", () => {
  it("reads the matches", () => {
    const body = [{ lat: "50.4445481", lon: "-119.1941593", display_name: "Armstrong, British Columbia, Canada" }];
    expect(parseNominatim(body)).toEqual([{ latitude: 50.4445481, longitude: -119.1941593, placeName: "Armstrong, British Columbia, Canada" }]);
  });

  it("returns nothing when nothing was found or the answer is odd", () => {
    expect(parseNominatim([])).toEqual([]);
    expect(parseNominatim({ error: "nope" })).toEqual([]);
    expect(parseNominatim([{ lat: "999", lon: "0", display_name: "x" }])).toEqual([]);
  });
});

describe("closestMatch", () => {
  const surreyUk = { latitude: 51.2715, longitude: -0.3415, placeName: "Surrey, England" };
  const surreyBc = { latitude: 49.1913, longitude: -122.8491, placeName: "Surrey, BC" };
  const portMoody = { latitude: 49.2838, longitude: -122.8317 };

  it("prefers the place nearest the brand", () => {
    expect(closestMatch([surreyUk, surreyBc], portMoody)).toBe(surreyBc);
  });

  it("keeps the search's ranking among places in the right area", () => {
    const lillooetTown = { latitude: 50.6866, longitude: -121.9361, placeName: "Lillooet (town)" };
    const lillooetDistrict = { latitude: 50.1, longitude: -122.6, placeName: "Squamish-Lillooet Regional District" };
    expect(closestMatch([lillooetTown, lillooetDistrict], portMoody)).toBe(lillooetTown);
  });

  it("keeps the search's best match when there is no reference point", () => {
    expect(closestMatch([surreyUk, surreyBc], null)).toBe(surreyUk);
    expect(closestMatch([], portMoody)).toBeNull();
  });

  it("measures distance in km", () => {
    expect(Math.round(distanceKm(portMoody, surreyBc))).toBe(10);
  });
});

describe("helpers", () => {
  it("treats the same address with different spacing or capitals as one", () => {
    expect(normaliseAddress("  Surrey,   BC ")).toBe(normaliseAddress("surrey, bc"));
  });

  it("links to the spot on openstreetmap.org", () => {
    expect(mapLink(49.1, -122.8)).toBe("https://www.openstreetmap.org/?mlat=49.1&mlon=-122.8#map=15/49.1/-122.8");
  });
});
