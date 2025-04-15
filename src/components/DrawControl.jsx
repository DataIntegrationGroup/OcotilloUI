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

export default DrawControl;
