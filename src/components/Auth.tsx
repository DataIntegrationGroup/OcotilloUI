import { useFiefAuth } from "@fief/fief/react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { fiefURL } from "@/providers/fief-provider";

export const Callback = () => {
  const fiefAuth = useFiefAuth();
  const navigate = useNavigate();
  useEffect(() => {
    fiefAuth.authCallback(fiefURL("callback")).then(() => {
      navigate("/home");
    });
  }, [fiefAuth, navigate]);

  return <p></p>;
};

export const RememberMe = () => {
  const { register } = useFormContext();

  return (
    <FormControlLabel
      sx={{
        span: {
          fontSize: "12px",
          color: "text.secondary",
        },
      }}
      color="secondary"
      control={
        <Checkbox size="small" id="rememberMe" {...register("rememberMe")} />
      }
      label="Remember me"
    />
  );
};
