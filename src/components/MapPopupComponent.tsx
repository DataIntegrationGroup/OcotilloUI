import {
  Table,
  TableContainer,
  TableCell,
  TableRow,
  TableBody,
} from "@mui/material";

export function mToFt(m: number) {
  return (m * 3.28084).toFixed(2);
}

export const SetMapPopupContent = ({ features, setPopupContent }) => {
  const transposedData = [
    { key: "Name", values: features.map((point) => point.properties.PointID) },
    {
      key: "Alternate Site ID",
      values: features.map((point) => point.properties.AlternateSiteID),
    },
  ];

  setPopupContent({
    coordinates: features[0].geometry.coordinates,
    children: (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h3 style={{ color: "black" }}>Click for more details</h3>
        <div style={{ display: "flex", gap: "1rem" }}>
          <TableContainer>
            <Table>
              <TableBody>
                {transposedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.key}</TableCell>
                    <TableCell>{row.values[0]}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    ),
  });
};
