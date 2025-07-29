import { dataForgeDataProvider } from '@/providers/dataforge-data-provider'
import { IWellInventoryForm } from '@/interfaces/dataforge/IWellInventoryForm'

export const createWellInventoryForm = async (data: IWellInventoryForm) => {
  // Create location
  const locationResponse = await dataForgeDataProvider.create({
    resource: 'dataforge.location',
    variables: {
      name: data.location.name,
      notes: data.location.notes,
      point: data.location.point,
      release_status: data.location.release_status,
    },
  })

  const locationId = locationResponse.data.id

  // Create well (thing)
  const wellResponse = await dataForgeDataProvider.create({
    resource: 'dataforge.thing/well',
    variables: {
      name: data.well.name,
      location_id: locationId,
      well_depth: data.well.well_depth,
      hole_depth: data.well.hole_depth,
      well_type: data.well.well_type,
      well_construction_notes: data.well.notes,
    },
  })

  const wellId = wellResponse.data.id

  // Create all contacts
  const contactResponses = []
  for (const contact of data.contacts) {
    const contactResponse = await dataForgeDataProvider.create({
      resource: 'dataforge.contact',
      variables: {
        name: contact.name,
        role: contact.role,
        thing_id: wellId,
        emails: contact.emails || [],
        phones: contact.phones?.map(phone => ({
          phone_number: phone.country_code ? `${phone.country_code}${phone.phone_number}` : phone.phone_number,
          phone_type: phone.phone_type
        })) || [],
        addresses: contact.addresses?.map(address => ({
          ...address,
          country: 'United States' 
        })) || [],
      },
    })

    contactResponses.push(contactResponse.data)
  }

  // Create assets if provided
  const assetResponses = []
  if (data.assets?.length) {
    for (const asset of data.assets) {
      const formData = new FormData()
      formData.append('label', asset.label)
      formData.append('name', asset.name)
      if (asset.file) {
        formData.append('file', asset.file)
      }

      const assetResponse = await dataForgeDataProvider.custom({
        url: 'asset',
        method: 'post',
        payload: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      assetResponses.push(assetResponse.data)
    }
  }

  return {
    location: locationResponse.data,
    well: wellResponse.data,
    contacts: contactResponses,
    assets: assetResponses,
  }
} 