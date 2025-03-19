import { ILocation, IOwner } from "@/interfaces";
import { fetchOwnerSearch } from "@/pages/amp/wellinventoryform/well_inventory.service";
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
  Skeleton,
} from "@mui/material";
import { useNotification } from "@refinedev/core";
import { useMutation } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm, Controller } from "react-hook-form";

export const SearchOwnerDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { open: openNotification, close: closeNotification } =
    useNotification();
  const { control, handleSubmit, reset } = useForm<{
    first_name: string;
    last_name: string;
  }>();
  const [owners, setOwners] = useState<IOwner[]>([]);
  const [locations, setLocations] = useState<Map<IOwner, ILocation[]>>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: fetchOwnerSearch,
    onMutate: () => {
      openNotification?.({
        key: "well-inventory-submission",
        type: "progress",
        message: "Submitting Well Inventory Form...",
      });
    },
    onSuccess: (data) => {
      closeNotification?.("well-inventory-submission");
      openNotification?.({
        type: "success",
        message: "Form Submitted Successfully!",
        description: "Your well inventory form has been submitted.",
      });

      setOwners(data.items.map((item) => item.owner));
    },
    onError: () => {
      closeNotification?.("well-inventory-submission");
      openNotification?.({
        type: "error",
        message: "Failed to Submit Form",
        description: "Please check your input and try again later.",
      });
    },
  });

  const handleSearch = (data: { first_name: string; last_name: string }) => {
    console.log({ data });
    mutate({
      first_name_like: data.first_name.toLocaleLowerCase(),
      last_name_like: data.last_name.toLocaleLowerCase(),
    });
  };

  const handleOwnerSelect = (owner: IOwner) => {
    console.log({ owner });
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xl">
      <DialogTitle>Search Owner</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(handleSearch)}>
          <Controller
            name="first_name"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="Search by First Name"
                fullWidth
                margin="normal"
              />
            )}
          />
          <Controller
            name="last_name"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                label="Search by Last Name"
                fullWidth
                margin="normal"
              />
            )}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Search
          </Button>
        </form>
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
              {isPending ? <Skeleton></Skeleton> : null}
              {owners?.map((owner) => (
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
