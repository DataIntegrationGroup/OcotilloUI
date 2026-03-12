import { StyleSheet } from '@react-pdf/renderer'
import { IPdfDensity } from '@/interfaces'

export const createPdfStyles = (density: IPdfDensity = 'standard') => {
  const scale = (n: number, d: number, vd: number) =>
    density === 'compact' ? vd : density === 'standard' ? d : n

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
      width: density === 'compact' ? '31.5%' : '32%',
      marginBottom: scale(2, 1.5, 1),
    },
    cell3Span2: {
      width: density === 'compact' ? '65.75%' : '66%',
      marginBottom: scale(2, 1.5, 1),
    },
    cell2: {
      width: density === 'compact' ? '49%' : '48%',
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
    table: {
      marginTop: scale(8, 6, 4),
      marginBottom: scale(8, 6, 4),
      borderWidth: 1,
      borderColor: '#ddd',
    },
    tableRowHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderColor: '#ddd',
      padding: scale(6, 4, 2),
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderColor: '#eee',
      padding: scale(6, 4, 2),
    },
    tableCellHeader: {
      flex: 1,
      fontSize: scale(8.5, 8, 7.5),
      fontWeight: 700,
    },
    tableCell: {
      flex: 1,
      fontSize: scale(8.5, 8, 7.5),
    },
  })
}
