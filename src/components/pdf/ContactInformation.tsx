import { View } from '@react-pdf/renderer'
import { LineItem, SubLineItem } from '@/components/pdf/layout'
import type { IContact } from '@/interfaces/ocotillo'
import { createPdfStyles, formatAddress } from '@/utils'

export const ContactInformation = ({
  primaryContact,
  secondaryContact,
  styles,
  dense = false,
}: {
  primaryContact: IContact
  secondaryContact: IContact
  styles: ReturnType<typeof createPdfStyles>
  dense?: boolean
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.twoByTwoGrid}>
        <View style={styles.cell2}>
          <LineItem
            title="Primary Contact"
            value={primaryContact?.name}
            styles={styles}
          />
        </View>
        <View style={styles.cell2}>
          <LineItem
            title="Secondary Contact"
            value={secondaryContact?.name}
            styles={styles}
          />
        </View>
        <View style={styles.cell2}>
          <SubLineItem
            title="Address"
            value={formatAddress(primaryContact?.addresses?.[0])}
            styles={styles}
          />
        </View>
        <View style={styles.cell2}>
          <SubLineItem
            title="Address"
            value={formatAddress(secondaryContact?.addresses?.[0])}
            styles={styles}
          />
        </View>
        <View style={styles.cell2}>
          <SubLineItem
            title="Role"
            value={primaryContact?.role}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell2}>
          <SubLineItem
            title="Role"
            value={secondaryContact?.role}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell2}>
          <SubLineItem
            title="Phone"
            value={
              primaryContact?.phones?.[0]?.phone_number ??
              primaryContact?.phones?.[0]?.nma_phone_number
            }
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell2}>
          <SubLineItem
            title="Phone"
            value={
              secondaryContact?.phones?.[0]?.phone_number ??
              secondaryContact?.phones?.[0]?.nma_phone_number
            }
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell2}>
          <SubLineItem
            title="Email"
            value={primaryContact?.emails?.[0]?.email}
            styles={styles}
            dense={dense}
          />
        </View>
        <View style={styles.cell2}>
          <SubLineItem
            title="Email"
            value={secondaryContact?.emails?.[0]?.email}
            styles={styles}
            dense={dense}
          />
        </View>
      </View>
    </View>
  )
}
