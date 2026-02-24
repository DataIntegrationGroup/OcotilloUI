import { StyleSheet } from '@react-pdf/renderer'
import { IPdfDensity } from '@/interfaces'

export const createPdfStyles = (density: IPdfDensity = 'normal') => {
  const scale = (n: number, d: number, vd: number) =>
    density === 'very-dense' ? vd : density === 'dense' ? d : n

  return StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#ffffff',
      padding: scale(20, 14, 10),
    },
    title: {
      fontSize: scale(20, 17, 14),
      paddingBottom: scale(25, 15, 10),
      fontWeight: 'bold',
      textAlign: 'center',
    },
    section: { marginBottom: scale(10, 6, 3) },
    subSection: { marginLeft: scale(16, 12, 8), marginBottom: 0 },
    twoByTwoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: scale(10, 6, 3),
    },
    cell3: {
      width: density === 'very-dense' ? '31.5%' : '32%',
      marginBottom: scale(2, 1.5, 1),
    },
    cell2: {
      width: density === 'very-dense' ? '49%' : '48%',
      marginBottom: scale(2, 1.5, 1),
    },
    label: { fontSize: scale(12, 11, 9), fontWeight: 'bold' },
    value: { fontSize: scale(12, 11, 9), marginBottom: scale(5, 3, 2) },
    img: {
      width: scale(175, 140, 100),
      height: 'auto',
      margin: scale(4, 3, 2),
      objectFit: 'contain',
      alignSelf: 'flex-start',
    },
    imgLabel: { fontSize: scale(10, 9, 7), margin: scale(4, 3, 2) },
    pageNote: {
      fontSize: scale(12, 10, 9),
      marginBottom: 5,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      bottom: scale(20, 14, 10),
      left: 40,
      right: 40,
      textAlign: 'center',
    },
    footerText: { fontSize: scale(9, 8.5, 7.5), color: '#777' },
  })
}
