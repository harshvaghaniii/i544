import { runTestSuites, GradeTypes } from 'gradescope-lib';

import fs from 'fs';

//cwd = submission

const RESULTS = 'results.json';
const DESCR = 'Project 1';

async function main() {
  const suitePaths = process.argv.slice(2);
  const suites: GradeTypes.TestSuite[] = [];
  try {
    for (const path of suitePaths) {
      const suite: GradeTypes.TestSuite = (await import(path)).default;
      suites.push(suite);
    }
    const result = await runTestSuites(DESCR, suites);
    if (!result.isOk) throw result;
    result.val.stdout_visibility= 'visible';
    const json = JSON.stringify(result.val, null, 2);
    fs.writeFileSync(RESULTS, json, 'utf8');
  }
  catch (err) {
    console.error(err);
    process.exit(1);
  }
}

await main();


  
