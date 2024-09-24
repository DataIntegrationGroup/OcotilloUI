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

import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useControl } from "react-map-gl";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useRef } from "react";

function DrawControl(props) {

    const drawRef = useRef(null);
    useControl(
        () => {
            drawRef.current = new MapboxDraw(props);
            return drawRef.current;
        },
        ({ map }) => {
            map.on("draw.create", props.onCreate);
            map.on("draw.update", props.onUpdate);
            map.on("draw.delete", props.onDelete);

            if (props?.defaultFeatures !== undefined) {
                drawRef.current.add({
                    type: "FeatureCollection",
                    features: props.defaultFeatures,
                });
            }

            if (props.onModeChange !== undefined) {
                map.on("draw.modechange", props.onModeChange);
            }
            if (props.onSelectionChange !== undefined) {
                map.on("draw.selectionchange", props.onSelectionChange);
            }
        },
        ({ map }) => {
            map.off("draw.create", props.onCreate);
            map.off("draw.update", props.onUpdate);
            map.off("draw.delete", props.onDelete);

            if (props.onSelectionChange !== undefined) {
                map.off("draw.selectionchange", props.onSelectionChange);
            }
            if (props.onModeChange !== undefined) {
                map.off("draw.modechange", props.onModeChange);
            }
        },
        {
            position: props.position,
        },
    );

    return null;
}

export default DrawControl
// ============= EOF =============================================