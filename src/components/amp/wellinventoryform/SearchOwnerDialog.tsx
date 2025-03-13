import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm, Controller } from "react-hook-form";

type Owner = {
  id: string;
  name: string;
  email: string;
};

export const SearchOwnerDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const [owners, setOwners] = useState<Owner[]>([]);

  const mockOwners: Owner[] = [
    { id: "1", name: "John Doe", email: "john.doe@example.com" },
    { id: "2", name: "Jane Smith", email: "jane.smith@example.com" },
    { id: "3", name: "Alice Johnson", email: "alice.johnson@example.com" },
    { id: "4", name: "Bob Williams", email: "bob.williams@example.com" },
    { id: "5", name: "Charlie Brown", email: "charlie.brown@example.com" },
    { id: "6", name: "Diana Prince", email: "diana.prince@example.com" },
    { id: "7", name: "Ethan Hunt", email: "ethan.hunt@example.com" },
    { id: "8", name: "Fiona Gallagher", email: "fiona.gallagher@example.com" },
    { id: "9", name: "George Bailey", email: "george.bailey@example.com" },
    { id: "10", name: "Hannah Montana", email: "hannah.montana@example.com" },
    { id: "11", name: "Isaac Newton", email: "isaac.newton@example.com" },
    { id: "12", name: "Jack Sparrow", email: "jack.sparrow@example.com" },
    { id: "13", name: "Karen Walker", email: "karen.walker@example.com" },
    { id: "14", name: "Leo Fitzgerald", email: "leo.fitzgerald@example.com" },
    { id: "15", name: "Mia Wallace", email: "mia.wallace@example.com" },
  ];

  const handleSearch = (data: { search: string }) => {
    // Simulate an API search by filtering mock data
    const results = mockOwners.filter((owner) =>
      owner.name.toLowerCase().includes(data.search.toLowerCase()),
    );
    setOwners(results);
  };

  const { control, handleSubmit, reset } = useForm<{ search: string }>();

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Search Owner</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(handleSearch)}>
          <Controller
            name="search"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="Search by Name"
                fullWidth
                margin="normal"
              />
            )}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Search
          </Button>
        </form>

        {/* Search Results Table */}
        {owners.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {owners.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell>{owner.name}</TableCell>
                    <TableCell>{owner.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOwnerSelect(owner)}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpen(false)} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
