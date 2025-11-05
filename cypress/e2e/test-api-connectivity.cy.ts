describe('API Connectivity Test', () => {
    it('should be able to reach API from browser', () => {
      cy.request({
        method: 'GET',
        url: 'http://localhost:8000/docs',
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(`API Response Status: ${response.status}`)
        expect(response.status).to.be.oneOf([200, 401]) // 401 is fine, means API is reachable
      })
      
      cy.request({
        method: 'GET',
        url: 'http://localhost:8000/thing',
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(`Thing endpoint Status: ${response.status}`)
        // Should get 401 (needs auth) or 200, not network error
        expect(response.status).to.not.eq(0)
      })
    })
  })