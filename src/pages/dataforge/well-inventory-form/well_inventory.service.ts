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
      },
    })

    const contactId = contactResponse.data.id

    // Create contact details (emails, phones, addresses)
    if (contact.emails?.length) {
      for (const email of contact.emails) {
        await dataForgeDataProvider.create({
          resource: 'dataforge.contact/email',
          variables: {
            email: email.email,
            email_type: email.email_type,
            contact_id: contactId,
          },
        })
      }
    }

    if (contact.phones?.length) {
      for (const phone of contact.phones) {
        await dataForgeDataProvider.create({
          resource: 'dataforge.contact/phone',
          variables: {
            phone_number: phone.phone_number,
            phone_type: phone.phone_type,
            contact_id: contactId,
          },
        })
      }
    }

    if (contact.addresses?.length) {
      for (const address of contact.addresses) {
        await dataForgeDataProvider.create({
          resource: 'dataforge.contact/address',
          variables: {
            address_line_1: address.address_line_1,
            address_line_2: address.address_line_2,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            address_type: address.address_type,
            contact_id: contactId,
          },
        })
      }
    }

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