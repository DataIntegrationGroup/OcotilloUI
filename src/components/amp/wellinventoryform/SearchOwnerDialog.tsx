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
  Typography,
  TablePagination,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useNotification } from "@refinedev/core";
import { useMutation } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useState } from "react";
import { useForm, Controller } from "react-hook-form";

interface IOwnerSearchForm {
  owner_key: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cell_phone: string;
}

export const SearchOwnerDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { open: openNotification, close: closeNotification } =
    useNotification();
  const { control, handleSubmit, reset } = useForm<IOwnerSearchForm>();

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    size: 10,
    pages: 1,
  });
  const [owners, setOwners] = useState<IOwner[] | null>(null);
  const [locations, setLocations] = useState<Map<string, ILocation[]>>(
    new Map(),
  );

  const { mutate, isPending } = useMutation({
    mutationFn: fetchOwnerSearch,
    onMutate: () => {
      openNotification?.({
        key: "owner-search",
        type: "progress",
        message: "Searching for owners...",
      });
    },
    onSuccess: (data) => {
      closeNotification?.("owner-search");
      openNotification?.({
        key: "owner-search-success",
        type: "success",
        message: "Search Completed",
        description: `Found ${data.total} owners.`,
      });

      setPagination({
        total: data.total,
        page: data.page,
        size: data.size,
        pages: data.pages,
      });
      setOwners(data.items.map((item) => item.owner));

      const locationMap = new Map<string, ILocation[]>();
      data.items.forEach((item) =>
        locationMap.set(item.owner.OwnerKey, item.locations),
      );
      setLocations(locationMap);
    },
    onError: () => {
      closeNotification?.("owner-search");
      openNotification?.({
        key: "owner-search-error",
        type: "error",
        message: "Failed to Search Owners",
        description: "Please check your input and try again.",
      });
    },
  });

  const handleSearch = (data: IOwnerSearchForm) => {
    mutate({
      owner_key_like: data.owner_key || "",
      first_name_like: data.first_name.toLocaleLowerCase() || "",
      last_name_like: data.last_name.toLocaleLowerCase() || "",
      email_like: data.email || "",
      phone_like: data.phone || "",
      cell_phone_like: data.cell_phone || "",
      page: 1,
      size: pagination.size,
    });
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage + 1 }));
    mutate({
      page: newPage + 1,
      size: pagination.size,
    });
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPagination({
      ...pagination,
      size: parseInt(event.target.value, 10),
      page: 1,
    });
    mutate({
      page: 1,
      size: parseInt(event.target.value, 10),
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
          <Grid
            container
            spacing={2}
            direction={{ xs: "column", sm: "row" }}
            sx={{ paddingTop: "1rem" }}
          >
            <Grid size={12}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="owner_key"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField {...field} label="Owner Key" fullWidth />
                  )}
                />
              </Grid>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <Controller
                name="first_name"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField {...field} label="First Name" fullWidth />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <Controller
                name="last_name"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField {...field} label="Last Name" fullWidth />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Controller
                name="email"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField {...field} label="Email" fullWidth />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <Controller
                name="phone"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField {...field} label="Phone" fullWidth />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <Controller
                name="cell_phone"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField {...field} label="Cell Phone" fullWidth />
                )}
              />
            </Grid>
          </Grid>
          <Grid
            container
            size={12}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{ paddingTop: "2rem", paddingBottom: "1rem" }}
          >
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  setOwners(null);
                  reset();
                }}
                color="secondary"
              >
                Reset
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isPending}
              >
                {isPending ? "Searching..." : "Search"}
              </Button>
            </Grid>
          </Grid>
        </form>
        {owners && owners?.length === 0 && !isPending ? (
          <Grid container alignItems="center" justifyContent="center">
            <Typography variant="h3">No Results Found</Typography>
          </Grid>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Owner Key</TableCell>
                    <TableCell>Frist Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone/Cell Phone</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isPending ? <SkeletonTableRow /> : null}
                  {owners?.map((owner) => (
                    <TableRow key={owner.OwnerKey}>
                      <TableCell>{owner.OwnerKey}</TableCell>
                      <TableCell>{owner.FirstName}</TableCell>
                      <TableCell>{owner.LastName}</TableCell>
                      <TableCell>{owner.Email}</TableCell>
                      <TableCell>
                        {owner.Phone}
                        {owner?.CellPhone ? `/ ${owner?.CellPhone}` : null}
                      </TableCell>
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
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={pagination.total}
              page={pagination.page - 1}
              rowsPerPage={pagination.size}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </>
        )}
      </DialogContent>
      <DialogActions style={{ padding: "20px 24px" }}>
        <Button
          variant="outlined"
          onClick={() => setOpen(false)}
          color="secondary"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SkeletonTableRow = () => (
  <TableRow>
    <TableCell>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={55}
        sx={{ borderRadius: "4px" }}
      ></Skeleton>
    </TableCell>
    <TableCell>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={55}
        sx={{ borderRadius: "4px" }}
      ></Skeleton>
    </TableCell>
    <TableCell>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={55}
        sx={{ borderRadius: "4px" }}
      ></Skeleton>
    </TableCell>
    <TableCell>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={55}
        sx={{ borderRadius: "4px" }}
      ></Skeleton>
    </TableCell>
    <TableCell>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={55}
        sx={{ borderRadius: "4px" }}
      ></Skeleton>
    </TableCell>
    <TableCell>
      <Button variant="outlined" size="small" disabled={true}>
        Select
      </Button>
    </TableCell>
  </TableRow>
);
