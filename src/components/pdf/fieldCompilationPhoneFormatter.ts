import type { IContact } from '@/interfaces/ocotillo'
import { formatPhone } from '@/utils/FormatPhone'

export const formatContactPhones = (contact?: IContact) => {
  const values =
    contact?.phones
      ?.map((phone) => {
        const rawPhone = phone?.phone_number?.trim()
        if (!rawPhone) return null

        const formattedPhone = formatPhone(rawPhone)
        return phone.phone_type
          ? `${phone.phone_type}: ${formattedPhone}`
          : formattedPhone
      })
      .filter((value): value is string => Boolean(value)) ?? []

  return values.length > 0 ? values.join('\n') : '-'
}
