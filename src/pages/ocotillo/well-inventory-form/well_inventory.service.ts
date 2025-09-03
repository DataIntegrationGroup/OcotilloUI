import { ocotilloDataProvider } from '@/providers/ocotillo-data-provider'
import { IWellInventoryForm } from '@/interfaces/ocotillo/IWellInventoryForm'

export const createWellInventoryForm = async (data: IWellInventoryForm) => {
  // Handle location (create new or use existing)
  let locationId: number
  let locationData: any

  if (data.locationMode === 'new') {
    // Create new location
    const locationResponse = await ocotilloDataProvider.create({
      resource: 'ocotillo.location',
      variables: {
        name: data.location.name,
        notes: data.location.notes,
        point: data.location.point,
        release_status: data.location.release_status,
      },
    })
    locationId = Number(locationResponse.data.id)
    locationData = locationResponse.data
  } else {
    // Use existing location
    locationId = Number(data.selectedLocationId!)
    locationData = { id: locationId }
  }

  // Create well (thing)
  const wellResponse = await ocotilloDataProvider.create({
    resource: 'ocotillo.thing/water-well',
    variables: {
      name: data.well.name,
      release_status: data.well.release_status,
      location_id: locationId,
      well_depth: data.well.well_depth,
      hole_depth: data.well.hole_depth,
      well_type: data.well.well_type,
      well_construction_notes: data.well.notes,
    },
  })

  const wellId = wellResponse.data.id

   // Create well screens
   if (data.wellScreens && data.wellScreens.length > 0) {
    for (const screen of data.wellScreens) {
      if (screen.screen_depth_top || screen.screen_depth_bottom || screen.screen_description) {
        await ocotilloDataProvider.create({
          resource: 'ocotillo.thing/well-screen',
          variables: {
            thing_id: wellId,
            screen_depth_bottom: screen.screen_depth_bottom || null,
            screen_depth_top: screen.screen_depth_top || null,
            screen_type: 'PVC', // default value
            screen_description: screen.screen_description || '',
            release_status: screen.release_status,
          },
        })
      }
    }
  }

  // Create all contacts
  const contactResponses = []
  for (const contact of data.contacts) {
    const contactResponse = await ocotilloDataProvider.create({
      resource: 'ocotillo.contact',
      variables: {
        name: contact.name,
        role: contact.role,
        thing_id: wellId,
        emails: contact.emails || [],
        release_status: contact.release_status,
        phones:
          contact.phones?.map((phone) => ({
            phone_number: phone.country_code
              ? `${phone.country_code}${phone.phone_number}`
              : phone.phone_number,
            phone_type: phone.phone_type,
            release_status: phone.release_status,
          })) || [],
        addresses:
          contact.addresses?.map((address) => ({
            ...address,
            country: 'United States',
            release_status: address.release_status,
          })) || [],
      },
    })

    contactResponses.push(contactResponse.data)
  }

  // Create assets if provided
  const assetResponses = []
  if (data.assets?.length) {
    for (const asset of data.assets) {
      // Only create assets that have been properly uploaded
      if (asset.storage_path && asset.mime_type && asset.size && asset.uri) {
        const assetResponse = await ocotilloDataProvider.create({
          resource: 'ocotillo.asset',
          variables: {
            name: asset.name,
            label: asset.label,
            storage_path: asset.storage_path,
            mime_type: asset.mime_type,
            size: asset.size,
            uri: asset.uri,
            thing_id: wellId,
            release_status: asset.release_status,
          },
        })

        assetResponses.push(assetResponse.data)
      }
    }
  }

  return {
    location: locationData,
    well: wellResponse,
    contacts: contactResponses,
    assets: assetResponses,
  }
}
