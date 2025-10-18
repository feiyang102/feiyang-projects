import _ from "lodash";

export function getTimestamp(count: number) {
  console.log(count);
  console.log(Date.now());
}

export function add(a: number, b: number) {
  console.log(_.add(a, b));
}
