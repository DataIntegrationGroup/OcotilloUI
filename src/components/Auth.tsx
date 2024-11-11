// ===============================================================================
// Copyright 2024 Jake Ross
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ===============================================================================

import {useFiefAuth} from "@fief/fief/react";
import {useNavigate} from "react-router-dom";
import {useEffect} from "react";
import {useFormContext} from "react-hook-form";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import {fiefURL} from "@/providers/fief-provider";

export const Callback = () => {
    const fiefAuth = useFiefAuth();
    const navigate = useNavigate();
    useEffect(() => {
        fiefAuth
            .authCallback(fiefURL('callback'))
            .then(() => {
                navigate("/home");
            });
    }, [fiefAuth, navigate]);

    return <p></p>;
};

export const RememberMe = () => {
    const {register} = useFormContext();

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
// ============= EOF =============================================