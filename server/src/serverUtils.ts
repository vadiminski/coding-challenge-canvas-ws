import { IConnectedPlayers } from "../../src/Interfaces";

export function arrayRemove(
  arr: IConnectedPlayers[],
  value: IConnectedPlayers
) {
  return arr.filter(function (ele) {
    return ele != value;
  });
}
