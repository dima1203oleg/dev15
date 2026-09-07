import { runAllContractTests } from './contract.test';

const report = runAllContractTests();

for (const result of report.results) {
  const marker = result.passed ? 'PASS' : 'FAIL';
  console.log(`[${marker}] ${result.suite}: ${result.name}${result.message ? ` — ${result.message}` : ''}`);
}

console.log(`\n${report.passed}/${report.total} contract checks passed.`);

if (report.failed > 0) {
  process.exitCode = 1;
}
