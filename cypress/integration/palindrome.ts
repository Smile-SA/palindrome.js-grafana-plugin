import { e2e } from '@grafana/e2e';

import palindrome, { devPalindrome } from '@smile/palindrome.js/src/index.js'

describe('Palindrome.js lib integration', () => {

  beforeEach(() => {
    cy.visit("http://localhost:3000");
  });


  it("should return correct configuration", () => {
    const configuration = devPalindrome(true);
    e2e().wrap(configuration).then(config => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(config).to.be.an('object').and.to.not.be.empty;
    });
    e2e().wrap(palindrome).should('be.a', 'function');
  });

  it("should open the edit panel and display Palindrome.js data structure", () => {
    e2e().get('[data-testid="data-testid\ Panel\ header\ Palindrome.js"]').should('be.visible');
    e2e().get('[data-testid="data-testid\ Panel\ menu\ Palindrome.js"]').click();
    e2e().get('[data-testid="data-testid\ Panel\ menu\ item\ Edit"]').click();
    e2e().get('[id="Palindrome.js"]').should('be.visible');
    e2e().wait(1000);
    e2e().get('[id="readOnlyDs"]').then(readOnlyDs => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(JSON.parse(Cypress.$(readOnlyDs).val() as string)).to.be.an('object').and.to.not.be.empty;
    });
  });

  it("should display Palindrome.js canvas", () => {
    e2e().get('[data-engine="three.js\ r140"]').should('be.visible');
  });

  it("should create a new Palindrome.js panel", () => {
    cy.visit('http://localhost:3000/dashboard/new?orgId=1');
    e2e().get('[aria-label="Add\ new\ panel"').click();
    e2e().get('[aria-label="Close\ dialog"').click();
    e2e().get('[data-testid="data-testid toggle-viz-picker"').click();
    e2e().get('[placeholder="Search for..."').type('Palindrome.js');
    e2e().get('[aria-label="Plugin\ visualization\ item\ Palindrome.js"').click();
    e2e().get('[id="readOnlyDs"]').should('be.empty');
    e2e().get('[id="info-metrics"]').should('be.visible');
    e2e().get('[id="info-query"]').should('be.visible');
    e2e().get('[data-testid="QueryEditorModeToggle"] label').contains('Code').click();
    e2e().get('[class="view-lines monaco-mouse-cursor-text"]').type('node_load1 #layer: serverMetrics, ranges: [0, 5, 10]');
    e2e().wait(1000);
    e2e().get('[aria-label="Query editor tab content"]')
      .find('button')
      .filter(':has(span)')
      .contains('Run queries').click();
    e2e().wait(1000);
    e2e().get('[id="info-metrics"]').should('not.exist');
    e2e().get('[id="info-query"]').should('not.exist');
    e2e().get('[id="readOnlyDs"]').then(readOnlyDs => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(JSON.parse(Cypress.$(readOnlyDs).val() as string)).to.be.an('object').and.to.not.be.empty;
    });
  });
})
