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

import {Chip} from "@mui/material";
import React, {useCallback, useEffect, useRef} from "react";
import {ExportButton} from "@refinedev/mui";

export function publicReleaseChip({row}) {
    return (
        <Chip
            size={"small"}
            sx={{
                backgroundColor: row?.PublicRelease ? "#8bd55c" : "#d86969",
                "& .MuiChip-label": {
                    padding: 0,
                    margin: 3
                }
            }}
            label={row?.PublicRelease ? "Yes" : "No"}/>
    )
}


export const useDebounce = (callback, delay) => {
    const handlerRef = useRef<ReturnType<typeof setTimeout>>();
    const debouncedCallback = useCallback((...args) => {
        if (handlerRef.current) {
            clearTimeout(handlerRef.current);
        }
        handlerRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
    // Cleanup
    useEffect(() => {
        return () => {
            if (handlerRef.current) {
                clearTimeout(handlerRef.current);
            }
        };
    }, []);
    return debouncedCallback;
};


// export function makeExportHeader({loading, onClick}){
//     return ({defaultButtons}) => {
//         return (
//             <>
//                 {defaultButtons}
//                 <ExportButton
//                     variant={'contained'}
//                     loading={loading}
//                     onClick={onClick} />
//             </>
//         )
//     }
// }
// ============= EOF =============================================