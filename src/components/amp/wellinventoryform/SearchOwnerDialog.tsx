import { IOwner } from "@/interfaces";
import { searchOwners } from "@/pages/amp/wellinventoryform/well_inventory.service";
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
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";

export const SearchOwnerDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { control, handleSubmit, reset } = useForm<{ search: string }>();
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [owners, setOwners] = useState<IOwner[]>([]);

  const { data, isLoading, error } = searchOwners({
    first_name_like: searchTerm || "",
  });

  const handleSearch = (data: { search: string }) => {
    console.log({ data });
    setSearchTerm(data.search.toLocaleLowerCase()); // Triggers query re-fetch
  };

  useEffect(() => {
    if (data) {
      setOwners(data.items.map((item) => item.owner));
    }
  }, [data]);

  const handleOwnerSelect = (owner: IOwner) => {
    console.log({ owner });
  };

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
        {owners?.length > 0 && (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Frist Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {owners.map((owner) => (
                  <TableRow key={owner.OwnerKey}>
                    <TableCell>{owner.FirstName}</TableCell>
                    <TableCell>{owner.LastName}</TableCell>
                    <TableCell>{owner.Email}</TableCell>
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
        <Button
          onClick={() => {
            setOwners([]);
            reset();
          }}
          color="secondary"
        >
          Reset
        </Button>
        <Button onClick={() => setOpen(false)} color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
