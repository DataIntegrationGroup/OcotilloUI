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

  @acceptance-criteria
  Scenario: Well information displays core physical attributes
    Then I should see the well name or point ID
    And I should see the well purpose
    And I should see the release status
    And I should see the hole depth
    And I should see the well depth
    And I should see the coordinates
    And I should see the elevation
    And I should see the alternate IDs

  Scenario: Map section displays interactive satellite view
    Then I should see the interactive satellite map

  Scenario: Hydrograph and observations are grouped together
    Then I should see the hydrograph visualization
    And I should see the recent water level observations table

  Scenario: Contacts section displays table with required fields
    Then I should see the contacts table
    And the table should show contact names
    And the table should show contact roles
    And the table should show contact types
    And the table should show email addresses
    And the table should show phone numbers
    And I should see the create contact button

  Scenario: Equipment section displays installed equipment
    Then I should see the equipment table
    And I should see the create equipment button
    And the table should show equipment names
    And the table should show equipment models
    And the table should show serial numbers
    And the table should show installation dates
    And the table should show removal dates
    And the table should show recording intervals
    And the table should show equipment notes

  Scenario: Well Screens section displays screen information
    Then I should see the well screens table
    And I should see the create well screen button
    And the table should show screen types
    And the table should show screen top depths
    And the table should show screen bottom depths

  Scenario: Attachments section displays attachments
    Then I should see the attachments section