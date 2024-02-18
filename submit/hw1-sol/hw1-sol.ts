#!/usr/bin/env ts-node

/** *** IMPORTANT NOTE ***

ALL FUNCTIONS BELOW MUST BE IMPLEMENTED WITHOUT USING RECURSION OR **ANY**
DESTRUCTIVE OPERATIONS.

Some consequences:

  + *NO LOOPS* of any kind.

  + Only const declarations.

  + Use Array methods like .map() and .reduce() and Array.from({length:n}) 
    (to create an empty n-element array).

  + No destructive Array methods like .push() (use .concat() instead).

  + You may use destructive methods like .reverse() as long as you
    use it only for its return value and not for its side-effects (this is
    because ts-node does not allow the use of the newer non-destructive
    .toReversed()).

  + Use String methods like split().

  + Use RegExp methods.

More details are in the .<restrictions.html> document linked from the
main assignment.

When fully implemented, running this file should result in the LOG
linked from the main assignment.

*/

// this file should be directly executable using ts-node without needing
// to compile it.  If you are in the directory containing this dir, you
// should be able to run it by simply typing ./hw1-sol.ts

const TODO = -1; //used for placeholder return value in initial assignment.

/** #1: "4-points"
 * TODO: Done
 *  Returns strings with each element reversed.
 */
function revStrings(strings: string[]): string[] {
    return strings.map((word) => word.split("").reverse().join(""));
}

if (false) {
    logTests("revStrings", [
        () => revStrings(["hello", "world"]),
        () => revStrings(["madam", "racecar"]),
        () => revStrings(["1234"]),
        () => revStrings([]),
    ]);
}

/** #2: "4-points"
 #  Return all words in str which start with an uppercase letter A-Z.
 *  Note that for this exercise and subsequent exercises, a word is
 *  defined to be a maximal sequence of length > 1 containing
 *  consecutive \w characters.
 * TODO: Done
 */
function getCapitalizedWords(str: string): string[] {
    return str
        .split(/\W+/)
        .filter((word) => word.length > 1 && /^[A-Z]/.test(word));
}

if (false) {
    logTests("getCapitalizedWords", [
        () => getCapitalizedWords(" Hello, world"),
        () => getCapitalizedWords(" A Big--Boy"),
        () => getCapitalizedWords("A B C "),
        () => getCapitalizedWords(""),
    ]);
}

/** #3: "4-points"
 #  Return all words in str which start with are camel-cased.
 *  A word is defined to be camel-cased if an uppercase letter A-Z
 *  immediately follows a lower-case letter a-z.
 * TODO: Done
 */
function getCamelCasedWords(str: string): string[] {
    return str
        .split(/\W+/)
        .filter((word) => word.length > 1 && /[a-z][A-Z]/.test(word));
}

if (false) {
    logTests("getCamelCasedWords", [
        () => getCamelCasedWords(" Helloworld"),
        () => getCamelCasedWords(" A BigBoy Barracuda--camelCased"),
        () => getCamelCasedWords("A B C "),
        () => getCamelCasedWords(""),
    ]);
}

/** #4: "5-points"
 *  Given a positive integer n > 0, return the list
 *  [1, 2, ..., (n-1), n, (n-1), ..., 2, ].
 * TODO: Done
 */
function upDown1n1(n: number): number[] {
    const first_array: number[] = Array.from(
        { length: n },
        (_, index: number) => index + 1
    );
    const second_array = first_array.slice(0, first_array.length - 1).reverse();
    return first_array.concat(second_array);
}

if (false) {
    logTests("upDown1n1", [
        () => upDown1n1(3),
        () => upDown1n1(5),
        () => upDown1n1(1),
    ]);
}

/** #5: "5-points"
 *  Given a list of distinct numbers, return true iff
 *  perms is a permutation of it.
 * TODO: Done
 */
function isPermutation(list: number[], perms: number[]): boolean {
    const newList: number[] = [...list];
    const newPerm: number[] = [...perms];

    return newList.sort().join(",") === newPerm.sort().join(",");
}

if (false) {
    logTests("isPermutation", [
        () => isPermutation([1, 3, 2], [1, 2, 3]),
        () => isPermutation([2, 3, 4], [2, 3, 4]),
        () => isPermutation([2, 3, 4], [2, 3, 1]),
        () => isPermutation([2], [2]),
        () => isPermutation([2, 1], [1, 2, 3]),
        () => isPermutation([1], []),
        () => isPermutation([], []),
    ]);
}

/** #6: "5-points"`
 *  Given a number x and an integer n >= 0, return x**n
 *  without using **.
 * TODO: Done
 */
function pow(x: number, n: number): number {
    const arr: number[] = new Array(n).fill(x);
    return arr.reduce(
        (accumulator, currentValue) => accumulator * currentValue,
        1
    );
}

if (false) {
    logTests("pow", [
        () => pow(2, 5),
        () => pow(-2, 3),
        () => pow(-5, 5),
        () => pow(-5, 0),
    ]);
}

/** #7: "5-points"
 *  Return x ** x ** x ** ... ** x with h x's.
 *  (i.e. the tetration of x to height h; see
 *  <https://en.wikipedia.org/wiki/Tetration>
 * TODO: Done
 */
// Hint: the JS ** operator is right associative
function tetrate(x: number, h: number): number {
    return Array.from({ length: h }, () => x).reduce(
        (accumulator, currentValue) => pow(currentValue, accumulator),
        1
    );
}

if (false) {
    logTests("tetrate", [
        () => tetrate(2, 4),
        () => tetrate(2, 5),
        () => tetrate(5, 2),
    ]);
}

/** #8: "5-points"
 *  A number in an arbitrary integer base b is represented by
 *  a list of "b-digits" [ d_0, d_1, d_2, ... ] where each d_i < b
 *  and has weight b**i.
 *
 *  For example, the decimal number 123 is represented by
 *  list of digits [3, 2, 1]; the hexadecimal number 0xabc is represented
 *  by the list of "hexadecimal-digits" [12, 11, 10].
 *
 *  Return the value of the number represented by list bDigits using
 *  base b.
 * TODO: Done
 */
function digitsNumberValueInBase(b: number, bDigits: number[]): number {
    return bDigits.reduce((result, item, index) => {
        return result + item * pow(b, index);
    }, 0);
}

if (false) {
    logTests("digitsNumberValueInBase", [
        () => digitsNumberValueInBase(10, [3, 2, 1]),
        () => digitsNumberValueInBase(10, [6, 5, 4, 3, 2, 1]),
        () => digitsNumberValueInBase(8, [7, 7, 3]),
        () => digitsNumberValueInBase(16, [3, 2, 1]),
        () => digitsNumberValueInBase(2, [1, 0, 1, 0, 1, 0, 1, 0]),
        () => digitsNumberValueInBase(60, [5, 12, 6]),
        () => digitsNumberValueInBase(60, []),
    ]);
}

/** #9: "7-points"
 *  If n is an integer, then JS allows n.toString(b) to return
 *  the string representation of n in base b, where 2 <= b <= 36.
 *  See <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString>.
 *
 *  Return the value of string str in base b.
 */
// *Hint*: use charCodeAt() <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charCodeAt>
function bStringValue(bString: string, b: number): number {
    return TODO;
}

if (false) {
    logTests("bStringValue", [
        () => bStringValue("123", 10),
        () => bStringValue("10101010", 2),
        () => bStringValue("377", 8),
        () => bStringValue("aAA", 16),
        () => bStringValue("2h5", 20),
    ]);
}

/** #10: "9-points"
 *  Given a list ls of 2n elements, return a n-element
 *  list of the consecutive pairs of ls.
 * TODO: Done
 */
function listPairs<T>(ls: T[]): T[][] {
    return ls
        .slice(0, ls.length / 2)
        .map((item, index) => [ls[index * 2], ls[index * 2 + 1]]);
}

if (false) {
    logTests("listPairs", [
        () => listPairs([1, 2]),
        () => listPairs([1, 2, 3, 4]),
        () => listPairs([1, 2, 3, 4, 5, 6]),
        () => listPairs(["a", "b", "c", "d"]),
        () => listPairs([[1, 2], [3], [4], [5, 6]]),
        () => listPairs([]),
    ]);
}

/** #11: "5-points"
 *  Given a list ls of n*m elements, return a m-element
 *  list of the consecutive n-tuples of ls.
 * TODO: Done
 */
// *Hint*: this is merely a generalization of the previous exercise
function nTuples<T>(ls: T[], n: number): T[][] {
    return Array.from({ length: ls.length / n }, (_, i) =>
        ls.slice(i * n, (i + 1) * n)
    );
}

if (false) {
    logTests("nTuples", [
        () => nTuples([1, 2], 1),
        () => nTuples([1, 2], 2),
        () => nTuples([1, 2, 3, 4, 5, 6], 3),
        () => nTuples(["a", "b", "c", "d", "e", "f"], 3),
        () => nTuples(["a", "b", "c", "d", "e", "f", "h", "i"], 4),
        () => nTuples([["a", "b"], ["c"], ["d"], ["e"], ["f", "h"], ["i"]], 3),
        () => nTuples([], 1),
        () => nTuples([], 10),
    ]);
}

/** #12: "9-points"
 *  Return the value of e approximated as the sum of 1/k! for
 *  k in 1, 2, 3, ..., n.
 *  See <https://en.wikipedia.org/wiki/E_(mathematical_constant)>
 * TODO: Done
 */
function e(n: number): number {
    return Array.from({ length: n }, (value, index) => index + 1).reduce(
        (eulerValue, item) => eulerValue + 1 / factorial(item),
        1
    );
}

if (false) {
    logTests("e", [() => e(6)]);
}

/**
 * Util function: factorial
 */

function factorial(n: number): number {
    return Array.from({ length: n }, (_, index) => index + 1).reduce(
        (fact, number) => fact * number,
        1
    );
}

// RETAIN STUFF BELOW

// for external testing purposes
export default {
    revStrings,
    getCapitalizedWords,
    getCamelCasedWords,
    upDown1n1,
    isPermutation,
    pow,
    tetrate,
    digitsNumberValueInBase,
    bStringValue,
    listPairs,
    nTuples,
    e,
};

//log as though running in node repl
function logTests(fnName: string, fns: ((...args: any[]) => any)[]): void {
    console.log(`***** ${fnName}() *****`);
    for (const fn of fns) {
        console.log(">", fn.toString().replace(/^\W+/, ""));
        console.log(fn());
    }
    console.log();
}
