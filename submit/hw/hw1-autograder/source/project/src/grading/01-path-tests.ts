import { GradeTypes, makePathTest } from 'gradescope-lib';

function test(path: string, mustExist = true) {
  const neg = mustExist ? '' : ' does not';
  const name = `check ${path}${neg} exists`;
  return makePathTest(path, { name });
}

const DIR = './hw1-sol';
const TESTS = [
  test(`${DIR}/hw1-sol.pdf`),
  test(`${DIR}/hw1-sol.ts`),
];



const SUITE_OPTS: GradeTypes.TestSuiteOpts = {
  abortOnFail: true,
  visibility: 'visible',
  name: 'Path Tests',
};
export default new GradeTypes.TestSuite(TESTS, SUITE_OPTS);



  
