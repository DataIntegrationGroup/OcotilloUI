@ui @well-detail
Feature: Well Detail Page
  As a hydrogeologist reviewing a well record
  I want to see well information organized clearly on a single page
  So that I can quickly understand the well’s monitoring status, ensure accurate data migration, and answer incoming well data requests. 

  Background:
    Given I open the Well Detail Page for well "1"

  @basic
  Scenario: Page renders all required UI Elements
    Then It should show all well response elements
    And I see the header Show Well
    And I see the Map
    And I see the Hydrograph
    And I see the Recent Water Level Observations
    And I see the Contacts section
    And I see the Equipment section
    And I see the Well Screens section
    And I see the Attachments section