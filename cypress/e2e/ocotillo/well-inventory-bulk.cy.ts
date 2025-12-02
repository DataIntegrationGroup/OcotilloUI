/// <reference types="cypress" />

describe('Well Inventory Bulk Import Page', () => {
    beforeEach(() => {
        cy.login()
        cy.visit('/ocotillo/well-inventory-bulk-import')
    })

    it('should render the well inventory bulk import page UI without errors', () => {
        cy.get('input').should('have.length.at.least', 1)
        cy.contains('Well Inventory Bulk Import').should('exist')
        cy.get('label').contains(/upload csv/i).should('exist')
        cy.get('button').contains(/submit/i).should('exist')
    })

    it('should preserve CSV data through parse and unparse cycle', () => {
        cy.readFile('cypress/fixtures/well-inventory.csv').then((originalCsv) => {
            cy.intercept('POST', '**/well-inventory-csv', (req) => {
                // For data sent as multipart string, check body contains CSV content
                const body = req.body as string
                const originalLines = originalCsv.split('\n')
                
                // Check that key data from original CSV is in the submitted body
                originalLines.forEach(line => {
                    if (line.trim()) {
                        //check all original csv fields for exact match in body
                        const fields = line.split(',')
                        fields.forEach(field => {
                            console.log("checking field: ", field.trim())
                            expect(body).to.include(field.trim())
                        })
                    }
                })
                
                req.reply({ 
                    statusCode: 200, 
                    body: { 
                        summary: { total_rows_processed: 1, total_rows_imported: 1, validation_errors_or_warnings: 0 }, 
                        wells: [], 
                        validation_errors: [] 
                    } 
                })
            }).as('submitCSV')
            
            cy.get('input[type="file"]').selectFile('cypress/fixtures/well-inventory.csv', { force: true })
            cy.wait(1500)
            cy.get('button').contains(/submit/i).click()
            cy.wait('@submitCSV')
        })
    })
})