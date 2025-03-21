import {
  ControlledEmailField,
  ControlledPhoneField,
} from "@/components/Controlled";
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
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useNotification } from "@refinedev/core";
import { useMutation } from "@tanstack/react-query";
import { Dispatch, Fragment, SetStateAction, useState } from "react";
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
  onOwnerSelect,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onOwnerSelect: (owner: IOwner) => void;
}) => {
  const { open: openNotification, close: closeNotification } =
    useNotification();
  const { control, handleSubmit, reset } = useForm<IOwnerSearchForm>();

  const [searchParams, setSearchParams] = useState<{
    owner_key_like: string;
    first_name_like: string;
    last_name_like: string;
    email_like: string;
    phone_like: string;
    cell_phone_like: string;
  } | null>(null);
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
      setPagination({ total: 0, page: 1, size: 10, pages: 1 });
      setOwners(null);
      setLocations(new Map());

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
      setPagination({ total: 0, page: 1, size: 10, pages: 1 });
      setOwners(null);
      setLocations(new Map());

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
    setSearchParams({
      owner_key_like: data.owner_key || "",
      first_name_like: data.first_name.toLocaleLowerCase() || "",
      last_name_like: data.last_name.toLocaleLowerCase() || "",
      email_like: data.email || "",
      phone_like: data.phone || "",
      cell_phone_like: data.cell_phone || "",
    });

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
    if (!searchParams) return;

    setPagination((prev) => ({ ...prev, page: newPage + 1 }));
    mutate({
      ...searchParams,
      page: newPage + 1,
      size: pagination.size,
    });
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!searchParams) return;

    setPagination({
      ...pagination,
      size: parseInt(event.target.value, 10),
      page: 1,
    });
    mutate({
      ...searchParams,
      page: 1,
      size: parseInt(event.target.value, 10),
    });
  };

  const handleOwnerSelect = (owner: IOwner) => {
    onOwnerSelect(owner);
    onClose();
  };

  const onClose = () => {
    handleCompleteReset();
    setOpen(false);
  };

  const handleCompleteReset = () => {
    reset();
    setOwners(null);
    setSearchParams(null);
    setPagination({ total: 0, page: 1, size: 10, pages: 1 });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
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
              <ControlledEmailField
                label="Email"
                control={control}
                name="email"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <ControlledPhoneField
                label="Phone"
                control={control}
                name="phone"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <ControlledPhoneField
                label="Cell Phone"
                control={control}
                name="cell_phone"
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
                onClick={handleCompleteReset}
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
                    <Fragment key={owner.OwnerKey}>
                      <TableRow
                        sx={{
                          borderBottom: "none",
                          borderTop: "1px solid rgba(224, 224, 224, 1)",
                        }}
                      >
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
                      <List dense>
                        {locations.get(owner.OwnerKey)?.map((location) => (
                          <ListItem key={location.PointID}>
                            <ListItemText
                              primary={`${location.SiteNames} (${location.PointID})`}
                              secondary={`State: ${location.State}, County: ${location.County}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Fragment>
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
        <Button variant="outlined" onClick={onClose} color="secondary">
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
