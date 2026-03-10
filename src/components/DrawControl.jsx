import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { useControl } from "react-map-gl";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useEffect, useRef } from "react";

const DRAW_RECTANGLE_MODE = "draw_rectangle";
const DRAW_RECTANGLE_EDIT_MODE = "draw_rectangle_edit";
const RECTANGLE_BUTTON_CLASS = "mapbox-gl-draw_rectangle";
const POLYGON_BUTTON_CLASS = "mapbox-gl-draw_polygon";
const RECTANGLE_SHAPE_PROPERTY = "__selection_shape";
const CURSORS = {
  default: "grab",
  drawing: "crosshair",
  move: "crosshair",
  moving: "grabbing",
  resize: "nwse-resize",
};
const POLYGON_ICON =
  "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M5 13.5 6.7 5.8l5.3-1.6 3.4 4.2-1.7 6-6.3 1.4z' fill='none' stroke='%23000' stroke-width='1.6' stroke-linejoin='round'/%3E%3Ccircle cx='6.7' cy='5.8' r='1' fill='%23000'/%3E%3Ccircle cx='12' cy='4.2' r='1' fill='%23000'/%3E%3Ccircle cx='15.4' cy='8.4' r='1' fill='%23000'/%3E%3Ccircle cx='13.7' cy='14.4' r='1' fill='%23000'/%3E%3Ccircle cx='7.4' cy='15.8' r='1' fill='%23000'/%3E%3C/svg%3E\")";
const RECTANGLE_ICON =
  "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath d='M4 5h12v10H4z' fill='none' stroke='%23000' stroke-width='1.8'/%3E%3C/svg%3E\")";

const rectangleCoordinates = (start, end) => [
  [
    [start[0], start[1]],
    [end[0], start[1]],
    [end[0], end[1]],
    [start[0], end[1]],
    [start[0], start[1]],
  ],
];

const rectangleFromDiagonal = (first, opposite) =>
  rectangleCoordinates(first, opposite);

const getRectangleOppositeCorner = (coordinates, index) => {
  const ring = coordinates?.[0] ?? [];
  const oppositeIndex = (index + 2) % 4;
  return ring[oppositeIndex];
};

const getRectangleCorners = (coordinates) => {
  const ring = coordinates?.[0] ?? [];
  return ring.slice(0, 4);
};

const cloneCoordinates = (coordinates) => JSON.parse(JSON.stringify(coordinates));

const isRectangleFeature = (feature) =>
  feature?.properties?.[RECTANGLE_SHAPE_PROPERTY] === "rectangle";

const setCanvasCursor = (map, cursor) => {
  const canvas = map?.getCanvas?.();
  const canvasContainer = map?.getCanvasContainer?.();
  if (!canvas) return;
  canvas.style.cursor = cursor;
  if (canvasContainer) {
    canvasContainer.style.cursor = cursor;
  }
};

const moveRectangleCoordinates = (coordinates, deltaLng, deltaLat) => {
  const corners = getRectangleCorners(coordinates);
  if (corners.length < 4) return coordinates;

  return [
    [
      ...corners.map(([lng, lat]) => [lng + deltaLng, lat + deltaLat]),
      [corners[0][0] + deltaLng, corners[0][1] + deltaLat],
    ],
  ];
};

const DrawRectangleMode = {
  onSetup() {
    const polygon = this.newFeature({
      type: "Feature",
      properties: {
        [RECTANGLE_SHAPE_PROPERTY]: "rectangle",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[]],
      },
    });

    this.addFeature(polygon);
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: "add" });
    setCanvasCursor(this.map, CURSORS.drawing);
    this.setActionableState({ trash: true });

    return {
      polygon,
      startPoint: null,
    };
  },
  onClick(state, e) {
    const nextPoint = [e.lngLat.lng, e.lngLat.lat];
    setCanvasCursor(this.map, CURSORS.drawing);

    if (!state.startPoint) {
      state.startPoint = nextPoint;
      state.polygon.setCoordinates(rectangleCoordinates(nextPoint, nextPoint));
      return;
    }

    state.polygon.setCoordinates(
      rectangleCoordinates(state.startPoint, nextPoint)
    );
    this.changeMode("simple_select", { featureIds: [state.polygon.id] });
  },
  onMouseMove(state, e) {
    setCanvasCursor(this.map, CURSORS.drawing);
    if (!state.startPoint) return;

    state.polygon.setCoordinates(
      rectangleCoordinates(state.startPoint, [e.lngLat.lng, e.lngLat.lat])
    );
  },
  onStop(state) {
    if (!this.getFeature(state.polygon.id)) return;

    const coordinates = state.polygon.getCoordinates()?.[0] ?? [];
    const [start, end] = [coordinates[0], coordinates[2]];
    const hasArea =
      Array.isArray(start) &&
      Array.isArray(end) &&
      (start[0] !== end[0] || start[1] !== end[1]);

    if (hasArea && state.polygon.isValid()) {
      this.map.fire("draw.create", {
        features: [state.polygon.toGeoJSON()],
      });
      return;
    }

    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode("simple_select", {}, { silent: true });
  },
  onTrash(state) {
    this.deleteFeature([state.polygon.id]);
    this.changeMode("simple_select");
  },
  toDisplayFeatures(state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.polygon.id;
    geojson.properties.active = isActivePolygon ? "true" : "false";
    if (!isActivePolygon) {
      display(geojson);
      return;
    }

    geojson.properties.meta = "feature";
    display(geojson);
  },
};

const DrawRectangleEditMode = {
  onSetup(options = {}) {
    const rectangle = this.getFeature(options.featureId);
    if (!rectangle) {
      throw new Error("Rectangle feature not found");
    }

    this.clearSelectedFeatures();
    this.select([rectangle.id]);
    this.setActionableState({ trash: true });
    this.updateUIClasses({ mouse: "move" });
    setCanvasCursor(this.map, CURSORS.move);

    return {
      rectangle,
      canDragMove: false,
      dragType: null,
      dragMoving: false,
      dragMoveLocation: null,
      draggingCornerIndex: null,
      dragOriginCoordinates: null,
    };
  },
  startDragging(state, e) {
    this.map.dragPan.disable();
    state.canDragMove = true;
    state.dragMoving = false;
    state.dragMoveLocation = e.lngLat;
  },
  stopDragging(state) {
    if (this.map?.dragPan) {
      this.map.dragPan.enable();
    }
    state.canDragMove = false;
    state.dragMoving = false;
    state.dragMoveLocation = null;
    state.dragType = null;
    state.draggingCornerIndex = null;
    state.dragOriginCoordinates = null;
  },
  onMouseDown(state, e) {
    const meta = e?.featureTarget?.properties?.meta;
    const coordPath = e?.featureTarget?.properties?.coord_path;
    const isActiveFeature =
      meta === "feature" &&
      e?.featureTarget?.properties?.active === "true";

    if (meta === "vertex" && coordPath) {
      const cornerIndex = Number(String(coordPath).split(".")[1]);
      if (!Number.isInteger(cornerIndex) || cornerIndex < 0 || cornerIndex > 3)
        return;

      this.startDragging(state, e);
      state.dragType = "resize";
      state.draggingCornerIndex = cornerIndex;
      state.dragOriginCoordinates = cloneCoordinates(
        state.rectangle.getCoordinates()
      );
      this.updateUIClasses({ mouse: "pointer" });
      setCanvasCursor(this.map, CURSORS.resize);
      return;
    }

    if (isActiveFeature) {
      this.startDragging(state, e);
      state.dragType = "move";
      state.dragOriginCoordinates = cloneCoordinates(
        state.rectangle.getCoordinates()
      );
      this.updateUIClasses({ mouse: "move" });
      setCanvasCursor(this.map, CURSORS.move);
    }
  },
  onDrag(state, e) {
    if (state.canDragMove !== true || !state.dragMoveLocation) return;
    state.dragMoving = true;
    e.originalEvent?.stopPropagation?.();

    if (state.dragType === "resize" && state.draggingCornerIndex !== null) {
      const oppositeCorner = getRectangleOppositeCorner(
        state.dragOriginCoordinates,
        state.draggingCornerIndex
      );
      if (!Array.isArray(oppositeCorner)) return;

      state.rectangle.setCoordinates(
        rectangleFromDiagonal([e.lngLat.lng, e.lngLat.lat], oppositeCorner)
      );
      state.dragMoveLocation = e.lngLat;
      setCanvasCursor(this.map, CURSORS.resize);
      return;
    }

    if (state.dragType === "move") {
      const deltaLng = e.lngLat.lng - state.dragMoveLocation.lng;
      const deltaLat = e.lngLat.lat - state.dragMoveLocation.lat;
      state.rectangle.setCoordinates(
        moveRectangleCoordinates(
          state.rectangle.getCoordinates(),
          deltaLng,
          deltaLat
        )
      );
      state.dragMoveLocation = e.lngLat;
      setCanvasCursor(this.map, CURSORS.moving);
    }
  },
  onMouseUp(state) {
    if (state.dragMoving) {
      this.map.fire("draw.update", {
        action: "change_coordinates",
        features: [state.rectangle.toGeoJSON()],
      });
    }
    this.stopDragging(state);
    this.updateUIClasses({ mouse: "move" });
    setCanvasCursor(this.map, CURSORS.move);
  },
  onMouseMove(state, e) {
    if (state.dragMoving) return;

    const meta = e?.featureTarget?.properties?.meta;
    if (meta === "vertex") {
      this.updateUIClasses({ mouse: "move" });
      setCanvasCursor(this.map, CURSORS.resize);
      return;
    }

    if (meta === "feature") {
      this.updateUIClasses({ mouse: "move" });
      setCanvasCursor(this.map, CURSORS.move);
      return;
    }

    this.updateUIClasses({ mouse: "none" });
    setCanvasCursor(this.map, CURSORS.move);
  },
  onClick(state, e) {
    if (!e?.featureTarget) {
      this.changeMode("simple_select", { featureIds: [state.rectangle.id] });
      return;
    }
    if (e?.featureTarget?.properties?.meta) return;
  },
  onStop() {
    if (this.map?.dragPan) {
      this.map.dragPan.enable();
    }
    this.updateUIClasses({ mouse: "none" });
    setCanvasCursor(this.map, CURSORS.default);
  },
  onTrash(state) {
    this.deleteFeature([state.rectangle.id]);
    this.changeMode("simple_select");
  },
  toDisplayFeatures(state, geojson, display) {
    const isActiveRectangle = geojson.properties.id === state.rectangle.id;
    geojson.properties.active = isActiveRectangle ? "true" : "false";
    geojson.properties.meta = "feature";
    display(geojson);

    if (!isActiveRectangle) return;

    const ring = geojson.geometry?.coordinates?.[0] ?? [];
    for (let index = 0; index < Math.min(4, ring.length); index += 1) {
      display(
        MapboxDraw.lib.createVertex(
          state.rectangle.id,
          ring[index],
          `0.${index}`,
          false
        )
      );
    }
  },
};

function DrawControl(props) {
  const drawRef = useRef(null);
  const mapRef = useRef(null);
  const rectangleButtonRef = useRef(null);
  const createHandlerRef = useRef(null);
  const modeChangeHandlerRef = useRef(null);
  const selectionChangeHandlerRef = useRef(null);
  const lastCreatedRectangleIdRef = useRef(null);

  const getButtonTitle = (label) =>
    props.disabled
      ? `${label}. Disabled unless exactly one layer is selected.`
      : `${label}. Enabled when exactly one layer is selected.`;

  const syncControlButtons = (map) => {
    if (!map) return;

    const container = map.getContainer();
    const polygonButton = container.querySelector(`.${POLYGON_BUTTON_CLASS}`);
    const trashButton = container.querySelector(".mapbox-gl-draw_trash");
    const buttons = [polygonButton, rectangleButtonRef.current, trashButton].filter(
      Boolean
    );

    if (polygonButton) {
      polygonButton.title = getButtonTitle("Polygon tool");
      polygonButton.setAttribute("aria-label", polygonButton.title);
      polygonButton.style.backgroundImage = POLYGON_ICON;
      polygonButton.style.backgroundRepeat = "no-repeat";
      polygonButton.style.backgroundPosition = "center";
      polygonButton.style.backgroundSize = "20px 20px";
    }

    if (trashButton) {
      trashButton.title = getButtonTitle("Delete selection");
      trashButton.setAttribute("aria-label", trashButton.title);
    }

    buttons.forEach((button) => {
      button.disabled = Boolean(props.disabled);
      button.style.opacity = props.disabled ? "0.45" : "";
      button.style.cursor = props.disabled ? "not-allowed" : "";
    });
  };

  const setRectangleButtonActive = (map) => {
    if (!rectangleButtonRef.current) return;
    const currentMode = drawRef.current?.getMode?.();
    const isActive =
      currentMode === DRAW_RECTANGLE_MODE ||
      currentMode === DRAW_RECTANGLE_EDIT_MODE;
    rectangleButtonRef.current.classList.toggle("active", Boolean(isActive));
    rectangleButtonRef.current.setAttribute(
      "aria-pressed",
      isActive ? "true" : "false"
    );
    if (currentMode === DRAW_RECTANGLE_MODE) {
      setCanvasCursor(map, CURSORS.drawing);
      return;
    }
    if (currentMode === DRAW_RECTANGLE_EDIT_MODE) {
      setCanvasCursor(map, CURSORS.move);
    }
  };

  const ensureRectangleButton = (map) => {
    if (rectangleButtonRef.current) return;

    const polygonButton = map
      .getContainer()
      .querySelector(`.${POLYGON_BUTTON_CLASS}`);
    const controlGroup = polygonButton?.parentElement;
    if (!controlGroup) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = `mapbox-gl-draw_ctrl-draw-btn ${RECTANGLE_BUTTON_CLASS}`;
    button.title = getButtonTitle("Rectangle tool");
    button.setAttribute("aria-label", button.title);
    button.style.backgroundImage = RECTANGLE_ICON;
    button.style.backgroundRepeat = "no-repeat";
    button.style.backgroundPosition = "center";
    button.style.backgroundSize = "18px 18px";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (props.disabled) return;
      drawRef.current?.changeMode(DRAW_RECTANGLE_MODE);
      setCanvasCursor(map, CURSORS.drawing);
      setRectangleButtonActive(map);
    });

    controlGroup.insertBefore(button, polygonButton.nextSibling);
    rectangleButtonRef.current = button;
    syncControlButtons(map);
    setRectangleButtonActive(map);
  };

  useControl(
    () => {
      drawRef.current = new MapboxDraw({
        ...props,
        modes: {
          ...MapboxDraw.modes,
          [DRAW_RECTANGLE_MODE]: DrawRectangleMode,
          [DRAW_RECTANGLE_EDIT_MODE]: DrawRectangleEditMode,
        },
      });
      return drawRef.current;
    },
    ({ map }) => {
      mapRef.current = map;
      createHandlerRef.current = (event) => {
        const createdRectangle = event?.features?.find(isRectangleFeature);
        lastCreatedRectangleIdRef.current = createdRectangle?.id ?? null;
        props.onCreate?.(event);
      };

      modeChangeHandlerRef.current = (event) => {
        const mode = event?.mode;
        if (mode === "draw_rectangle" || mode === "draw_polygon") {
          setCanvasCursor(map, CURSORS.drawing);
        } else if (mode === "draw_rectangle_edit") {
          setCanvasCursor(map, CURSORS.move);
        } else {
          setCanvasCursor(map, CURSORS.default);
        }
        setRectangleButtonActive(map);
      };

      selectionChangeHandlerRef.current = (event) => {
        const selectedFeature = event?.features?.[0];
        const isRectangle = isRectangleFeature(selectedFeature);
        const currentMode = drawRef.current?.getMode?.();

        if (selectedFeature?.id === lastCreatedRectangleIdRef.current) {
          lastCreatedRectangleIdRef.current = null;
          setRectangleButtonActive(map);
          return;
        }

        if (
          isRectangle &&
          currentMode !== DRAW_RECTANGLE_MODE &&
          currentMode !== DRAW_RECTANGLE_EDIT_MODE
        ) {
          drawRef.current?.changeMode(DRAW_RECTANGLE_EDIT_MODE, {
            featureId: selectedFeature.id,
          });
          return;
        }

        setRectangleButtonActive(map);
      };

      map.on("draw.create", createHandlerRef.current);
      map.on("draw.update", props.onUpdate);
      map.on("draw.delete", props.onDelete);
      ensureRectangleButton(map);
      syncControlButtons(map);

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
      map.on("draw.modechange", modeChangeHandlerRef.current);
      map.on("draw.selectionchange", selectionChangeHandlerRef.current);
    },
    ({ map }) => {
      mapRef.current = null;
      if (createHandlerRef.current) {
        map.off("draw.create", createHandlerRef.current);
        createHandlerRef.current = null;
      }
      map.off("draw.update", props.onUpdate);
      map.off("draw.delete", props.onDelete);

      if (props.onSelectionChange !== undefined) {
        map.off("draw.selectionchange", props.onSelectionChange);
      }
      if (selectionChangeHandlerRef.current) {
        map.off("draw.selectionchange", selectionChangeHandlerRef.current);
        selectionChangeHandlerRef.current = null;
      }
      if (props.onModeChange !== undefined) {
        map.off("draw.modechange", props.onModeChange);
      }
      if (modeChangeHandlerRef.current) {
        map.off("draw.modechange", modeChangeHandlerRef.current);
        modeChangeHandlerRef.current = null;
      }
      rectangleButtonRef.current?.remove();
      rectangleButtonRef.current = null;
    },
    {
      position: props.position,
    },
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    syncControlButtons(map);

    if (!props.disabled) return;

    const currentMode = drawRef.current?.getMode?.();
    if (
      currentMode === DRAW_RECTANGLE_MODE ||
      currentMode === DRAW_RECTANGLE_EDIT_MODE ||
      currentMode === "draw_polygon"
    ) {
      drawRef.current?.changeMode("simple_select");
      setCanvasCursor(map, CURSORS.default);
      setRectangleButtonActive(map);
    }
  }, [props.disabled]);

  return null;
}

export default DrawControl;
